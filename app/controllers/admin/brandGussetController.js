const path = require('path');
 
module.exports = function (model) {
    const module = {};
 
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
        return res.render('backend/gusset/brandGussetList', {
            title: 'Gusset Brands', brands, gussetManagement: 'active', gussetBrandManagement: 'active',
            user: req.session.admin,
            error: req.flash('error'),
            success: req.flash('success'),
        });
    };
 
    module.create = function (req, res) {
        return res.render('backend/gusset/brandGussetForm', {
            title: 'Add Gusset Brand', gussetManagement: 'active', user: req.session.admin,
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
            title: 'Edit Gusset Brand', gussetManagement: 'active', gussetBrandManagement: 'active',
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