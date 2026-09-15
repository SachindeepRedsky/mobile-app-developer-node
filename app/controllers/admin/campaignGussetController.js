const isHttpUrl = (value) => {
    try {
        const parsed = new URL(value);
        return ['http:', 'https:'].includes(parsed.protocol);
    } catch (error) {
        return false;
    }
};
 
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { QueryTypes } = require('sequelize');

const publicGussetAdId = (adId) => String(adId || '').replace(/^gusset-/, '');

function getPublicBaseUrl(req) {
    const configuredBaseUrl = String(process.env.BASE_URL || '').replace(/\/$/, '');
    if (configuredBaseUrl && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(configuredBaseUrl)) {
        return configuredBaseUrl;
    }
    return `${req.protocol}://${req.get('host')}`;
}
 
async function generateGussetCampaignQrPath(qrContent, adId) {
    const qrDirectory = path.join(__dirname, '../../../public/dist/qr_codes');
    if (!fs.existsSync(qrDirectory)) {
        fs.mkdirSync(qrDirectory, { recursive: true });
    }
    const fileName = `gusset_${adId}.png`;
    const filePath = path.join(qrDirectory, fileName);
    await QRCode.toFile(filePath, qrContent, {
        type: 'png',
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 300,
    });
    console.log('QR DIRECTORY:', qrDirectory);
    console.log('QR FILE PATH:', filePath);
    console.log('QR FILE EXISTS:', fs.existsSync(filePath));
    console.log('QR FILE SIZE:', fs.existsSync(filePath) ? fs.statSync(filePath).size : 0);
    return `/dist/qr_codes/${fileName}`;
}
 
module.exports = function (model) {
    const module = {};

    module.scanAnalytics = async function (req, res) {
        try {
            const campaignId = Number(req.params.id);
            const period = ['daily', 'weekly', 'monthly'].includes(req.query.period)
                ? req.query.period
                : 'daily';
            if (!Number.isInteger(campaignId) || campaignId <= 0) {
                return res.status(400).json({ success: false, message: 'Invalid campaign ID.' });
            }

            const campaign = await model.GussetCampaign.findByPk(campaignId, {
                attributes: ['id', 'campaignName'],
            });
            if (!campaign) {
                return res.status(404).json({ success: false, message: 'Gusset campaign not found.' });
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
                WHERE ga.gusset_campaign_id = :campaignId
                  AND gs.event_type IN ('gusset_scan', 'gusset_view')
                GROUP BY ${periodExpression}
                ORDER BY ${periodExpression} ASC
            `, {
                replacements: { campaignId },
                type: QueryTypes.SELECT,
            });

            return res.json({
                success: true,
                campaignId: campaign.id,
                campaignName: campaign.campaignName,
                period,
                data: rows.map((row) => ({ date: row.date, scanCount: Number(row.scanCount) })),
            });
        } catch (error) {
            console.error('Gusset campaign scan analytics error:', error);
            return res.status(500).json({ success: false, message: 'Unable to load scan analytics.' });
        }
    };
 
    module.list = async function (req, res) {
        const campaigns = await model.GussetCampaign.findAll({
            include: [
                { model: model.GussetBrand, as: 'brandDetails', attributes: ['brandName'] },
                { model: model.GussetAd, as: 'ads', attributes: ['adId', 'qrToken', 'destinationUrl'] },
            ],
            order: [['id', 'DESC']],
        });
        await Promise.all(campaigns.map(async (campaign) => {
            const ad = campaign.ads && campaign.ads[0];
            console.log('[gussetCampaign.list] Processing campaign', { campaignId: campaign.id,  ad });
            if (ad) {
                const scanUrl = `${getPublicBaseUrl(req)}/g/${publicGussetAdId(ad.adId)}`;
                ad.dataValues.scanUrl = scanUrl;
                ad.dataValues.qrImageUrl = await generateGussetCampaignQrPath(scanUrl, ad.adId);
                console.log('[gussetCampaign.list] QR image ready', {
                    campaignId: campaign.id,
                    adId: ad.adId,
                    scanUrl,
                    qrImageUrl: ad.dataValues.qrImageUrl,
                });
            }
        }));
        return res.render('backend/gusset/campaignGussetList', {
            title: 'Gusset Campaigns', campaigns, analyticsCampaigns: campaigns, gussetManagement: 'active', gussetMenuOpen: 'menu-open', gussetCampaignManagement: 'active',
            user: req.session.admin,
            error: req.flash('error'),
            success: req.flash('success'),
        });
    };
 
    module.qr = async function (req, res) {
        try {
            const ad = await model.GussetAd.findOne({
                where: { adId: req.params.adId },
                raw: true,
            });
            if (!ad) {
                return res.status(404).send('QR code not found');
            }
            const scanUrl = `${getPublicBaseUrl(req)}/g/${publicGussetAdId(ad.adId)}`;
            const image = await QRCode.toBuffer(scanUrl, {
                type: 'png',
                errorCorrectionLevel: 'M',
                margin: 2,
                width: 240,
            });
            res.set('Content-Type', 'image/png');
            res.set('Content-Length', image.length);
            res.set('Cache-Control', 'no-store');
            console.log('[gussetCampaign.qr] QR code generated', {
                adId: ad.adId,
                scanUrl,
                imageSize: image.length,
                contentType: 'image/png',
            });
            return res.send(image);
        } catch (error) {
            console.error('[gussetCampaign.qr] Error:', error);
            return res.status(500).send('Unable to generate QR code');
        }
    };
 
    module.create = async function (req, res) {
        const brands = await model.GussetBrand.findAll({ where: { status: 'active' }, order: [['brandName', 'ASC']] });
        return res.render('backend/gusset/campaignGussetForm', {
            title: 'Add Gusset Campaign', brands, gussetManagement: 'active', gussetMenuOpen: 'menu-open', user: req.session.admin,
            campaign: null,
            error: req.flash('error'),
            success: req.flash('success'),
        });
    };
 
    module.edit = async function (req, res) {
        const [campaign, brands] = await Promise.all([
            model.GussetCampaign.findByPk(req.params.id),
            model.GussetBrand.findAll({ where: { status: 'active' }, order: [['brandName', 'ASC']] }),
        ]);
        if (!campaign) {
            req.flash('error', 'Gusset campaign not found.');
            return res.redirect('/backend/gusset/campaign');
        }
        return res.render('backend/gusset/campaignGussetForm', {
            title: 'Edit Gusset Campaign', brands, campaign,
            gussetManagement: 'active', gussetMenuOpen: 'menu-open', gussetCampaignManagement: 'active', user: req.session.admin,
            error: req.flash('error'),
            success: req.flash('success'),
        });
    };
 
    module.store = async function (req, res) {
        const { campaignName, brandId, destinationUrl, status } = req.body;
        if (!campaignName || !brandId || !isHttpUrl(destinationUrl)) {
            req.flash('error', 'Campaign name, brand and a valid HTTP/HTTPS destination URL are required.');
            return res.redirect('/backend/gusset/campaign/new');
        }
        const brand = await model.GussetBrand.findOne({ where: { id: brandId, status: 'active' } });
        if (!brand) {
            req.flash('error', 'Please select an active Gusset brand.');
            return res.redirect('/backend/gusset/campaign/new');
        }
        const campaign = await model.GussetCampaign.create({
            campaignName, gussetBrandId: brandId, destinationUrl, status: status || 'active',
        });
        console.log('[gussetCampaign.store] Campaign created', { campaignId: campaign.id, campaignName, brandId, destinationUrl });
        await model.GussetAd.create({
            adId: `gusset-${crypto.randomBytes(12).toString('hex')}`,
            qrToken: crypto.randomBytes(24).toString('hex'),
            destinationUrl,
            gussetCampaignId: campaign.id,
        });
        const ad = await model.GussetAd.findOne({ where: { gussetCampaignId: campaign.id }, order: [['id', 'DESC']] });
        const scanUrl = `${getPublicBaseUrl(req)}/g/${publicGussetAdId(ad.adId)}`;
        const qrImageUrl = await generateGussetCampaignQrPath(scanUrl, ad.adId);
        console.log('[gussetCampaign.store] QR file generated', { adId: ad.adId, scanUrl, qrImageUrl });
        req.flash('success', 'Gusset campaign created successfully.');
        return res.redirect('/backend/gusset/campaign');
    };
 
    module.update = async function (req, res) {
        const { campaignName, brandId, destinationUrl, status } = req.body;
        const campaign = await model.GussetCampaign.findByPk(req.params.id);
        const brand = await model.GussetBrand.findOne({ where: { id: brandId, status: 'active' } });
        if (!campaign || !brand || !campaignName || !isHttpUrl(destinationUrl)) {
            req.flash('error', 'Campaign name, active brand and a valid HTTP/HTTPS destination URL are required.');
            return res.redirect(`/backend/gusset/campaign/edit/${req.params.id}`);
        }
        await campaign.update({
            campaignName, gussetBrandId: brandId, destinationUrl,
            status: status || 'active',
        });
        await model.GussetAd.update({ destinationUrl }, { where: { gussetCampaignId: campaign.id } });
        req.flash('success', 'Gusset campaign updated successfully.');
        return res.redirect('/backend/gusset/campaign');
    };
 
    module.remove = async function (req, res) {
        const campaign = await model.GussetCampaign.findByPk(req.params.id);
        if (!campaign) {
            req.flash('error', 'Gusset campaign not found.');
            return res.redirect('/backend/gusset/campaign');
        }
        await model.GussetAd.destroy({ where: { gussetCampaignId: campaign.id } });
        await campaign.destroy();
        req.flash('success', 'Gusset campaign deleted successfully.');
        return res.redirect('/backend/gusset/campaign');
    };
 
    return module;
};