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
    return `/dist/qr_codes/${fileName}`;
}
 
module.exports = function (model) {
    const module = {};
 
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
                const scanUrl = `${process.env.BASE_URL || `${req.protocol}://${req.get('host')}`}/g/${ad.adId}`;
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
            title: 'Gusset Campaigns', campaigns, gussetManagement: 'active', gussetCampaignManagement: 'active',
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
            const scanUrl = `${process.env.BASE_URL || `${req.protocol}://${req.get('host')}`}/g/${ad.adId}`;
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
            title: 'Add Gusset Campaign', brands, gussetManagement: 'active', user: req.session.admin,
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
            gussetManagement: 'active', gussetCampaignManagement: 'active', user: req.session.admin,
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
        const scanUrl = `${process.env.BASE_URL || `${req.protocol}://${req.get('host')}`}/g/${ad.adId}`;
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