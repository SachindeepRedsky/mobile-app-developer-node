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

function escapeXml(value) {
    return String(value || '').replace(/[<>&"']/g, (character) => ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&apos;',
    })[character]);
}

function wrapPosterTitle(value) {
    const words = String(value || 'CAMPAIGN').trim().split(/\s+/);
    const lines = [''];
    words.forEach((word) => {
        const currentLine = lines[lines.length - 1];
        if ((currentLine + ' ' + word).trim().length > 23 && lines.length < 2) {
            lines.push(word);
        } else if (lines.length === 2 && currentLine.length + word.length > 23) {
            lines[1] = lines[1].slice(0, 20).trimEnd() + '...';
        } else {
            lines[lines.length - 1] = (currentLine + ' ' + word).trim();
        }
    });
    return lines.map((line) => escapeXml(line));
}

async function getBrandLogoDataUri(brandLogo) {
    const logoName = path.basename(String(brandLogo || ''));
    const extension = path.extname(logoName).toLowerCase();
    const mimeType = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' }[extension];
    if (!mimeType || !brandLogo || !String(brandLogo).startsWith('/dist/brandLogo/')) {
        return '';
    }
    const logoPath = path.join(__dirname, '../../../public/dist/brandLogo', logoName);
    try {
        const logo = await fs.promises.readFile(logoPath);
        return `data:${mimeType};base64,${logo.toString('base64')}`;
    } catch (error) {
        return '';
    }
}

const campaignImageMimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
};

function saveCampaignImage(file) {
    return new Promise((resolve, reject) => {
        const extension = path.extname(String(file.name || '')).toLowerCase();
        if (!campaignImageMimeTypes[extension] || file.size > 10 * 1024 * 1024) {
            return reject(new Error('Campaign image must be JPG or PNG and smaller than 10 MB.'));
        }

        const fileName = `${crypto.randomBytes(16).toString('hex')}${extension}`;
        const uploadDirectory = path.join(process.cwd(), 'public/dist/campaignImages');
        const relativePath = `/dist/campaignImages/${fileName}`;
        fs.mkdirSync(uploadDirectory, { recursive: true });
        file.mv(path.join(uploadDirectory, fileName), (error) => error ? reject(error) : resolve(relativePath));
    });
}

async function readCampaignImage(imageUrl) {
    const fileName = path.basename(String(imageUrl || ''));
    const extension = path.extname(fileName).toLowerCase();
    if (!campaignImageMimeTypes[extension] || !String(imageUrl).startsWith('/dist/campaignImages/')) {
        throw new Error('Unsupported campaign image');
    }

    const imageBuffer = await fs.promises.readFile(path.join(process.cwd(), 'public/dist/campaignImages', fileName));
    let width;
    let height;
    if (extension === '.png') {
        if (imageBuffer.length < 24 || imageBuffer.toString('hex', 0, 8) !== '89504e470d0a1a0a') {
            throw new Error('Invalid PNG campaign image');
        }
        width = imageBuffer.readUInt32BE(16);
        height = imageBuffer.readUInt32BE(20);
    } else {
        let offset = 2;
        while (offset < imageBuffer.length) {
            if (imageBuffer[offset] !== 0xff) {
                offset += 1;
                continue;
            }
            while (imageBuffer[offset] === 0xff) offset += 1;
            const marker = imageBuffer[offset++];
            if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) continue;
            if (offset + 2 > imageBuffer.length) break;
            const segmentLength = imageBuffer.readUInt16BE(offset);
            if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
                height = imageBuffer.readUInt16BE(offset + 3);
                width = imageBuffer.readUInt16BE(offset + 5);
                break;
            }
            if (segmentLength < 2) break;
            offset += segmentLength;
        }
        if (!width || !height) throw new Error('Invalid JPEG campaign image');
    }
    if (!width || !height) throw new Error('Invalid campaign image dimensions');

    return {
        dataUri: `data:${campaignImageMimeTypes[extension]};base64,${imageBuffer.toString('base64')}`,
        width,
        height,
    };
}

function createCampaignImageQrSvg(image, qrDataUri) {
    const qrSize = Math.round(Math.min(image.width, image.height) * 0.17);
    const qrX = Math.round(image.width * 0.855 - qrSize / 2);
    const qrY = Math.round(image.height * 0.840 - qrSize / 2);
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${image.width}" height="${image.height}" viewBox="0 0 ${image.width} ${image.height}"><image href="${image.dataUri}" x="0" y="0" width="${image.width}" height="${image.height}"/><image href="${qrDataUri}" x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}"/></svg>`;
}

// function createCampaignPosterSvg({ campaignName, brandName, logoDataUri, qrDataUri, destinationUrl, publicBaseUrl }) {
//     const displayBrandName = String(brandName || 'Brand').trim();
//     const brandNameLength = Array.from(displayBrandName).length;
//     const brandNameFontSize = Math.max(14, Math.min(26, Math.floor(300 / (brandNameLength * 0.62))));
//     const brandNamePlateWidth = Math.min(326, Math.max(156, Math.ceil(brandNameLength * brandNameFontSize * 0.62 + 38)));
//     const brandNamePlateX = 384 - (brandNamePlateWidth / 2);
//     const titleLines = wrapPosterTitle(campaignName);
//     const titleSvg = titleLines.map((line, index) =>
//         `<text x="384" y="${150 + (index * 52)}" text-anchor="middle" class="title">${line}</text>`
//     ).join('');
//     const logoSvg = logoDataUri
//         ? `<image href="${logoDataUri}" x="326" y="312" width="116" height="116" preserveAspectRatio="xMidYMid slice" clip-path="url(#brandLogoClip)"/>`
//         : `<text x="384" y="397" text-anchor="middle" class="brand-initial">${escapeXml(String(brandName || 'B').trim().charAt(0).toUpperCase())}</text>`;
//     const destinationHost = (() => {
//         try { return new URL(destinationUrl).hostname; } catch (error) { return ''; }
//     })();
//     const hostedDomain = (() => {
//         try { return new URL(publicBaseUrl).host; } catch (error) { return ''; }
//     })();
//     const footerGroupX = Math.max(8, (768 - (Array.from(hostedDomain).length * 11 + 26)) / 2);

//     return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="768" height="768" viewBox="0 0 768 768">
// <defs>
//     <linearGradient id="background" x2="1" y2="1"><stop stop-color="#031633"/><stop offset="1" stop-color="#092e60"/></linearGradient>
//     <linearGradient id="accent" x2="1" y2="1"><stop stop-color="#7438ff"/><stop offset="1" stop-color="#a329f6"/></linearGradient>
//     <linearGradient id="titleFill" x2="0" y2="1"><stop stop-color="#fff"/><stop offset="1" stop-color="#dce5ff"/></linearGradient>
//     <linearGradient id="panel" x2="0" y2="1"><stop stop-color="#143c75" stop-opacity=".92"/><stop offset="1" stop-color="#061d42" stop-opacity=".96"/></linearGradient>
//     <pattern id="dots" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#dce8ff" opacity=".55"/></pattern>
//     <clipPath id="brandLogoClip"><circle cx="384" cy="370" r="58"/></clipPath>
//     <filter id="titleShadow" x="-20%" y="-30%" width="140%" height="170%"><feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur"/><feOffset dy="3" result="offsetBlur"/><feComponentTransfer><feFuncA type="linear" slope=".35"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
//     <style>
//         text{font-family:Arial,Helvetica,sans-serif;fill:#fff}.title{font-size:43px;font-weight:800;fill:url(#titleFill);filter:url(#titleShadow)}.eyebrow{font-size:15px;font-weight:700;letter-spacing:2px;fill:#c8b5ff}.subtitle{font-size:18px;fill:#d8e2f5}.brand-name{font-size:26px;font-weight:700;fill:#fff;filter:url(#titleShadow)}.small{font-size:15px;fill:#dbe6fa}.brand-initial{font-size:76px;font-weight:700;fill:#6430f5}.footer-domain{font-size:19px;font-weight:700;letter-spacing:1px}
//     </style>
// </defs>
// <rect width="768" height="768" fill="url(#background)"/>
// <path d="M0 0h174L0 66z" fill="url(#accent)"/><path d="M0 0h142L0 52z" fill="#9b68ff" opacity=".75"/>
// <rect x="24" y="108" width="48" height="72" fill="url(#dots)"/><rect x="694" y="284" width="48" height="72" fill="url(#dots)"/>
// <g fill="#061128" opacity=".78">
//     <path d="M0 480h25v-48h18v32h17v-66h22v31h18v-58h24v83h15v-35h29v67h22v-92h18v35h20v-59h29v74h22v-44h18v92h19v-62h28v44h18v-81h20v-31h24v72h23v-55h25v81h17v-37h26v59h18v-87h24v57h21v-42h28v83h21v-55h22v-47h22v89h18v-65h20v102H0z"/>
//     <path d="M0 566h768v119H0z" fill="#07172f"/>
// </g>
// <g fill="#163968" opacity=".72">
//     <path d="M0 526h35v-50h22v71h28v-94h29v98h22v-54h28v79h25v-113h28v71h24v-48h28v101h20v-70h36v84h25v-62h22v54h27v-91h25v71h24v-49h29v78h20v-84h35v85h18v-62h32v83h27v-92h24v65h23v-77h29v110H0z"/>
// </g>
// <text x="384" y="83" text-anchor="middle" class="eyebrow">ANALYTICS CAMPAIGN</text>
// ${titleSvg}
// <path d="M150 218h134M484 218h134" stroke="#d9e4fa" stroke-opacity=".7"/>
// <rect x="295" y="206" width="178" height="30" rx="8" fill="url(#accent)"/>
// <text x="384" y="227" text-anchor="middle" class="eyebrow">FEATURED BRAND</text>
// <text x="384" y="267" text-anchor="middle" class="subtitle">Explore the campaign and discover more</text>
// <rect x="205" y="286" width="358" height="190" rx="28" fill="transparent"/>
// <circle cx="384" cy="370" r="64" fill="#f1f4fa" stroke="#e2e8f2" stroke-width="3"/>
// ${logoSvg}
// <rect x="${brandNamePlateX}" y="442" width="${brandNamePlateWidth}" height="38" rx="19" fill="#071d3c" fill-opacity=".88" stroke="#b9a5ff" stroke-opacity=".32"/>
// <text x="384" y="467" text-anchor="middle" class="brand-name" style="font-size:${brandNameFontSize}px">${escapeXml(displayBrandName)}</text>
// <path d="M352 488h64" stroke="url(#accent)" stroke-width="3" stroke-linecap="round"/>
// <rect x="80" y="500" width="608" height="190" rx="28" fill="url(#panel)" stroke="#6045de" stroke-opacity=".85"/>
// <text x="118" y="544" class="eyebrow">SCAN TO EXPLORE</text>
// <text x="118" y="575" class="small">Point your camera at the QR code</text>
// <rect x="118" y="597" width="222" height="52" rx="26" fill="url(#accent)"/>
// <text x="222" y="631" text-anchor="middle" style="font-family:Arial,Helvetica,sans-serif;font-size:21px;font-weight:700;fill:#fff">SCAN NOW</text>
// <path d="M310 623h15m-6-6 6 6-6 6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
// <text x="118" y="674" class="small">${escapeXml(destinationHost)}</text>
// <rect x="493" y="513" width="158" height="158" rx="12" fill="#fff" stroke="#e5e9f2" stroke-width="2"/>
// <image href="${qrDataUri}" x="499" y="519" width="146" height="146" preserveAspectRatio="xMidYMid meet"/>
// <path d="M481 531v-20h20M663 531v-20h-20M481 653v20h20M663 653v20h-20" fill="none" stroke="#a329f6" stroke-width="5"/>
// <path d="M0 710h768v58H0z" fill="url(#accent)"/>
// <circle cx="${footerGroupX + 8}" cy="740" r="8" fill="none" stroke="#fff" stroke-width="1.5"/><path d="M${footerGroupX} 740h16M${footerGroupX + 8} 732c4 4 4 12 0 16M${footerGroupX + 8} 732c-4 4-4 12 0 16" fill="none" stroke="#fff" stroke-width="1"/>
// <text x="${footerGroupX + 26}" y="747" class="footer-domain">${escapeXml(hostedDomain)}</text>
// </svg>`;
// }

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

    module.creative = async function (req, res) {
        try {
            const campaign = await model.GussetCampaign.findByPk(req.params.id, {
                include: [
                    { model: model.GussetBrand, as: 'brandDetails', attributes: ['brandName', 'brandLogo'] },
                    { model: model.GussetAd, as: 'ads', attributes: ['adId', 'destinationUrl'] },
                ],
            });
            const ad = campaign && campaign.ads && campaign.ads[0];
            if (!campaign || !ad) {
                return res.status(404).send('Campaign creative not found');
            }

            const scanUrl = `${getPublicBaseUrl(req)}/g/${publicGussetAdId(ad.adId)}`;
            const qrDataUri = await QRCode.toDataURL(scanUrl, { errorCorrectionLevel: 'H', margin: 2, width: 320 });
            if (!campaign.creativeUrl) {
                const qrImage = Buffer.from(qrDataUri.split(',')[1], 'base64');
                res.set('Content-Type', 'image/png');
                res.set('Cache-Control', 'private, no-cache');
                return res.send(qrImage);
            }

            const image = await readCampaignImage(campaign.creativeUrl);
            const svg = createCampaignImageQrSvg(image, qrDataUri);
            res.set('Content-Type', 'image/svg+xml; charset=utf-8');
            res.set('Cache-Control', 'private, no-cache');
            return res.send(svg);
        } catch (error) {
            console.error('Gusset campaign creative error:', error);
            return res.status(500).send('Unable to generate campaign creative');
        }
    };
 
    module.create = async function (req, res) {
        const brands = await model.GussetBrand.findAll({ where: { status: 'active' }, order: [['brandName', 'ASC']] });
        return res.render('backend/gusset/campaignGussetForm', {
            title: 'Add Campaign', brands, gussetManagement: 'active', gussetMenuOpen: 'menu-open', user: req.session.admin,
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
        const campaignImageFile = req.files && req.files.campaignImage;
        if (!campaignName || !brandId || !isHttpUrl(destinationUrl)) {
            req.flash('error', 'Campaign name, brand and a valid HTTP/HTTPS destination URL are required.');
            return res.redirect('/backend/gusset/campaign/new');
        }
        if (!campaignImageFile) {
            req.flash('error', 'Please upload a campaign image.');
            return res.redirect('/backend/gusset/campaign/new');
        }
        const brand = await model.GussetBrand.findOne({ where: { id: brandId, status: 'active' } });
        if (!brand) {
            req.flash('error', 'Please select an active Gusset brand.');
            return res.redirect('/backend/gusset/campaign/new');
        }
        let creativeUrl;
        try {
            creativeUrl = await saveCampaignImage(campaignImageFile);
        } catch (error) {
            req.flash('error', error.message || 'Unable to save campaign image.');
            return res.redirect('/backend/gusset/campaign/new');
        }
        const campaign = await model.GussetCampaign.create({
            campaignName, gussetBrandId: brandId, destinationUrl, creativeUrl, status: status || 'active',
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
        const campaignImageFile = req.files && req.files.campaignImage;
        const campaign = await model.GussetCampaign.findByPk(req.params.id);
        const brand = await model.GussetBrand.findOne({ where: { id: brandId, status: 'active' } });
        if (!campaign || !brand || !campaignName || !isHttpUrl(destinationUrl)) {
            req.flash('error', 'Campaign name, active brand and a valid HTTP/HTTPS destination URL are required.');
            return res.redirect(`/backend/gusset/campaign/edit/${req.params.id}`);
        }
        let creativeUrl = campaign.creativeUrl;
        if (campaignImageFile) {
            try {
                creativeUrl = await saveCampaignImage(campaignImageFile);
            } catch (error) {
                req.flash('error', error.message || 'Unable to save campaign image.');
                return res.redirect(`/backend/gusset/campaign/edit/${req.params.id}`);
            }
        }
        await campaign.update({
            campaignName, gussetBrandId: brandId, destinationUrl,
            creativeUrl,
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