const path = require('path');
const { QueryTypes } = require('sequelize');
 
module.exports = function (model) {
    const module = {};

    module.scanAnalytics = async function (req, res) {
        try {
            const brandId = Number(req.params.id);
            const period = ['daily', 'weekly', 'monthly'].includes(req.query.period)
                ? req.query.period
                : 'daily';
            if (!Number.isInteger(brandId) || brandId <= 0) {
                return res.status(400).json({ success: false, message: 'Invalid brand ID.' });
            }

            const brand = await model.GussetBrand.findOne({
                where: { id: brandId, status: 'active' },
                attributes: ['id', 'brandName'],
            });
            if (!brand) {
                return res.status(404).json({ success: false, message: 'Gusset brand not found.' });
            }

            const periodExpression = {
                daily: 'DATE(gs.scanned_at)',
                weekly: 'DATE_SUB(DATE(gs.scanned_at), INTERVAL WEEKDAY(gs.scanned_at) DAY)',
                monthly: "DATE_FORMAT(gs.scanned_at, '%Y-%m-01')",
            }[period];
            const rows = await model.GussetScan.sequelize.query(`
                SELECT ${periodExpression} AS date, COUNT(gs.id) AS scanCount
                FROM gusset_scans AS gs
                INNER JOIN gusset_ads AS ga ON ga.ad_id = gs.gusset_ad_id
                INNER JOIN gusset_campaigns AS gc ON gc.id = ga.gusset_campaign_id
                WHERE gc.gusset_brand_id = :brandId
                  AND gs.event_type IN ('gusset_scan', 'gusset_view')
                GROUP BY ${periodExpression}
                ORDER BY ${periodExpression} ASC
            `, {
                replacements: { brandId },
                type: QueryTypes.SELECT,
            });

            return res.json({
                success: true,
                brandId: brand.id,
                brandName: brand.brandName,
                period,
                data: rows.map((row) => ({
                    date: row.date,
                    scanCount: Number(row.scanCount),
                })),
            });
        } catch (error) {
            console.error('Gusset brand scan analytics error:', error);
            return res.status(500).json({ success: false, message: 'Unable to load scan analytics.' });
        }
    };
 
    const saveLogo = (file) => new Promise((resolve, reject) => {
        if (!file) {
            return resolve(null);
        }
        const extension = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';
        if (!['jpg', 'jpeg', 'png'].includes(extension) || file.size > 2 * 1024 * 1024) {
            return reject(new Error('Logo must be JPG or PNG and smaller than 2 MB.'));
        }
        const filename = `${Date.now()}-${Math.round(Math.random() * 1e6)}.${extension}`;
        const relativePath = `/dist/brandLogo/${filename}`;
        file.mv(path.join(process.cwd(), 'public', relativePath), (error) => error ? reject(error) : resolve(relativePath));
    });
 
    module.list = async function (req, res) {
        const brands = await model.GussetBrand.findAll({ order: [['id', 'DESC']] });
        const analyticsBrands = brands.filter((brand) => brand.status === 'active');
        return res.render('backend/gusset/brandGussetList', {
            title: 'Gusset Brands', brands, analyticsBrands, gussetManagement: 'active', gussetMenuOpen: 'menu-open', gussetBrandManagement: 'active',
            user: req.session.admin,
            error: req.flash('error'),
            success: req.flash('success'),
        });
    };
 
    module.create = function (req, res) {
        return res.render('backend/gusset/brandGussetForm', {
            title: 'Add Gusset Brand', gussetManagement: 'active', gussetMenuOpen: 'menu-open', user: req.session.admin,
            brand: null,
            error: req.flash('error'), success: req.flash('success'),
        });
    };

    module.edit = async function (req, res) {
        const brand = await model.GussetBrand.findByPk(req.params.id);
        if (!brand) {
            req.flash('error', 'Gusset brand not found.');
            return res.redirect('/backend/gusset/brand');
        }
        return res.render('backend/gusset/brandGussetForm', {
            title: 'Edit Gusset Brand', gussetManagement: 'active', gussetMenuOpen: 'menu-open', gussetBrandManagement: 'active',
            user: req.session.admin, brand,
            error: req.flash('error'), success: req.flash('success'),
        });
    };
 
    module.store = async function (req, res) {
        try {
            const brandName = String(req.body.brandName || '').trim();
            const status = req.body.status === 'inactive' ? 'inactive' : 'active';
            const logo = req.files && req.files.picture__input;
 
            if (!brandName) {
                req.flash('error', 'Brand name is required.');
                return res.redirect('/backend/gusset/brand/new');
            }
            if (!logo) {
                req.flash('error', 'Brand logo is required.');
                return res.redirect('/backend/gusset/brand/new');
            }
 
            const brandLogo = await saveLogo(logo);
            await model.GussetBrand.create({ brandName, brandLogo, status });
            req.flash('success', 'Gusset brand created successfully.');
            return res.redirect('/backend/gusset/brand');
        } catch (error) {
            console.error('Gusset brand create error:', error);
            req.flash('error', error.message || 'Unable to create gusset brand.');
            return res.redirect('/backend/gusset/brand/new');
        }
    };

    module.update = async function (req, res) {
        try {
            const brand = await model.GussetBrand.findByPk(req.params.id);
            const brandName = String(req.body.brandName || '').trim();
            const status = req.body.status === 'inactive' ? 'inactive' : 'active';
            const logo = req.files && req.files.picture__input;

            if (!brand) {
                req.flash('error', 'Gusset brand not found.');
                return res.redirect('/backend/gusset/brand');
            }
            if (!brandName) {
                req.flash('error', 'Brand name is required.');
                return res.redirect(`/backend/gusset/brand/edit/${brand.id}`);
            }

            const updateData = { brandName, status };
            if (logo) updateData.brandLogo = await saveLogo(logo);
            await brand.update(updateData);
            req.flash('success', 'Gusset brand updated successfully.');
            return res.redirect('/backend/gusset/brand');
        } catch (error) {
            console.error('Gusset brand update error:', error);
            req.flash('error', error.message || 'Unable to update gusset brand.');
            return res.redirect(`/backend/gusset/brand/edit/${req.params.id}`);
        }
    };
 
    module.remove = async function (req, res) {
        const brand = await model.GussetBrand.findByPk(req.params.id);
        if (!brand) {
            req.flash('error', 'Gusset brand not found.');
            return res.redirect('/backend/gusset/brand');
        }
        const campaignCount = await model.GussetCampaign.count({ where: { gussetBrandId: brand.id } });
        if (campaignCount > 0) {
            req.flash('error', 'This Gusset brand has campaigns and cannot be deleted.');
            return res.redirect('/backend/gusset/brand');
        }
        await brand.destroy();
        req.flash('success', 'Gusset brand deleted successfully.');
        return res.redirect('/backend/gusset/brand');
    };
 
    return module;
};