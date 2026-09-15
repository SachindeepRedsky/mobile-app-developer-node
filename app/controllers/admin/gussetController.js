const crypto = require("crypto");
const { Op } = require("sequelize");
 
module.exports = function (model, config) {
    const module = {};
 
    // ==========================================
    // Gusset Tracking Public QR Redirect
    // ==========================================
    module.trackGusset = async function (req, res) {
        try {
            const { qrToken } = req.params;
 
            if (!qrToken) {
                return res.status(400).send("Invalid QR code");
            }
 
            const ad = await model.GussetAd.findOne({
                where: {
                    qrToken: qrToken,
                },
                include: [{
                    model: model.GussetCampaign,
                    as: "campaignDetails",
                    include: [{ model: model.GussetBrand, as: "brandDetails" }],
                }],
            });
 
            if (!ad) {
                return res.status(404).send("QR code not found");
            }
 
            const campaign = ad.get("campaignDetails");
            const destinationUrl = campaign && campaign.get("destinationUrl");
 
            if (!destinationUrl) {
                return res.status(404).send("Destination URL not configured");
            }
 
            // Only allow http/https URLs
            let parsedUrl;
 
            try {
                parsedUrl = new URL(destinationUrl);
            } catch (error) {
                return res.status(400).send("Invalid destination URL");
            }
 
            if (!["http:", "https:"].includes(parsedUrl.protocol)) {
                return res.status(400).send("Invalid destination URL");
            }
 
            // Generate unique click ID
            const clickId = crypto.randomUUID();
 
            // Save scan
            await model.GussetScan.create({
                clickId: clickId,
                qrToken: qrToken,
                gussetAdId: ad.get("adId"),
                eventType: req.gussetEventType || "gusset_scan",
                ipAddress: req.ip || null,
                userAgent: req.get("user-agent") || null,
                referer: req.get("referer") || null,
                scannedAt: new Date(),
            });
 
            // Add tracking parameters
            parsedUrl.searchParams.set("utm_source", "bbites");
            parsedUrl.searchParams.set("utm_medium", "gusset");
            parsedUrl.searchParams.set("bb_click_id", clickId);
 
            return res.redirect(parsedUrl.toString());
 
        } catch (error) {
            console.error("[trackGusset] Error:", error);
            return res.status(500).send("Unable to process QR scan");
        }
    };
 
    module.trackGussetView = async function (req, res) {
        try {
            const { gussetAdId } = req.params;
            const publicAdId = String(gussetAdId || '');
            const ad = await model.GussetAd.findOne({
                where: {
                    adId: publicAdId.startsWith('gusset-') ? publicAdId : `gusset-${publicAdId}`,
                },
                raw: true,
            });
 
            if (!ad || !ad.qrToken) {
                return res.status(404).send("Gusset ad not found");
            }
 
            const clickId = crypto.randomUUID();
            const parsedUrl = new URL(ad.destinationUrl);
            if (!["http:", "https:"].includes(parsedUrl.protocol)) {
                return res.status(400).send("Invalid destination URL");
            }
            await model.GussetScan.create({
                clickId,
                qrToken: ad.qrToken,
                gussetAdId: ad.adId,
                eventType: "gusset_view",
                scannedAt: new Date(),
                ipAddress: req.ip || null,
                userAgent: req.get("user-agent") || null,
                referer: req.get("referer") || null,
            });
            parsedUrl.searchParams.set("utm_source", "bbites");
            parsedUrl.searchParams.set("utm_medium", "gusset");
            parsedUrl.searchParams.set("bb_click_id", clickId);
            return res.redirect(parsedUrl.toString());
        } catch (error) {
            console.error("[trackGussetView] Error:", error);
            return res.status(500).send("Unable to process Gusset ad view");
        }
    };
 
 
    // ==========================================
    // Gusset Tracking Admin UI
    // ==========================================
    module.view = async function (req, res) {
        try {
            // ------------------------------------------
            // Total Gusset Scans
            // ------------------------------------------
            const totalScans = await model.GussetScan.count({
                include: [
                    {
                        model: model.GussetAd,
                        as: "adDetails",
                        required: true,
                        include: [
                            {
                                model: model.GussetCampaign,
                                as: "campaignDetails",
                                required: true,
                            },
                        ],
                    },
                ],
            });
 
 
            // ------------------------------------------
            // Total QR Codes
            // ------------------------------------------
            const totalQrCodes = await model.GussetAd.count({
    include: [
        {
            model: model.GussetCampaign,
            as: "campaignDetails",
            required: true,
        },
    ],
});
 
 
            // ------------------------------------------
            // Get Gusset Tracking Records
            // ------------------------------------------
            const records = await model.GussetScan.findAll({
                include: [
                    {
                        model: model.GussetAd,
                        as: "adDetails",
                        required: true,
                        include: [
                            {
                                model: model.GussetCampaign,
                                as: "campaignDetails",
                                include: [{ model: model.GussetBrand, as: "brandDetails" }],
                            },
                        ],
                    },
                ],
                order: [
                    ["scannedAt", "DESC"],
                ],
            });
 
            const eventCounts = await model.GussetScan.findAll({
                attributes: [
                    "gussetAdId",
                    [model.GussetScan.sequelize.fn("COUNT", model.GussetScan.sequelize.col("id")), "scanCount"],
                ],
                where: { eventType: { [Op.in]: ["gusset_scan", "gusset_view"] } },
                group: ["gussetAdId"],
                raw: true,
            });
            const scanCounts = eventCounts.reduce((counts, item) => {
                counts[item.gussetAdId] = Number(item.scanCount);
                return counts;
            }, {});
 
            const gussetAdIds = [...new Set(records.map((record) => record.get("gussetAdId")).filter(Boolean))];
            const gussetAds = gussetAdIds.length
                ? await model.GussetAd.findAll({
                    where: { adId: { [Op.in]: gussetAdIds } },
                    include: [{
                        model: model.GussetCampaign,
                        as: "campaignDetails",
                        include: [{ model: model.GussetBrand, as: "brandDetails" }],
                    }],
                })
                : [];
            const gussetAdsById = gussetAds.reduce((ads, ad) => {
                ads[ad.get("adId")] = ad;
                return ads;
            }, {});
console.log("records::", records)
            records.forEach((record) => {
                const adId = record.get("gussetAdId");
                const ad = gussetAdsById[adId] || record.get("adDetails");
                const gussetCampaign = ad && ad.get("campaignDetails");
                const gussetBrand = gussetCampaign && gussetCampaign.get("brandDetails");
                const scanCount = scanCounts[adId] || 0;
                record.setDataValue("scanCount", scanCount);
                record.setDataValue("adDetails", ad);
                record.setDataValue("trackingBrandName", gussetBrand?.get("brandName") || "-");
                record.setDataValue("trackingCampaignName", gussetCampaign?.get("campaignName") || "-");
                record.setDataValue("trackingDestinationUrl", gussetCampaign?.get("destinationUrl") || "");
                record.setDataValue("status", ad?.get("status") || gussetCampaign?.get("status") || "unknown");
            });
 
 
            // ------------------------------------------
            // Get Unique Advertisers
            // ------------------------------------------
            // const advertiserRecords = await model.GussetScan.findAll({
            //     attributes: ["brandId"],
            //     where: {
            //         brandId: {
            //             [Op.ne]: null,
            //         },
            //     },
            //     group: ["brandId"],
            //     raw: true,
            // });
 
            const advertiserRecords = await model.GussetCampaign.findAll({
                include: [
                    { model: model.GussetBrand, as: 'brandDetails', attributes: ['brandName'] },
                    { model: model.GussetAd, as: 'ads', attributes: ['adId', 'qrToken', 'destinationUrl'] },
                ],
                where: {
                    status: 'active',
                },
                order: [['id', 'DESC']],
            });
 
            const totalAdvertisers = advertiserRecords.length;
            const totalBrands = await model.GussetBrand.count({
                where: {
                    status: 'active',
                },
            });
 
 
            const viewRecords = [
                ...new Map(
                    records
                        .filter((record) => record.get("adDetails"))
                        .map((record) => {
                            const data = record.toJSON();
                            const adId = data.gussetAdId;
                            return [adId, data];
                        })
                ).values(),
            ];
 
            // ------------------------------------------
            // Render Gusset Tracking Page
            // ------------------------------------------
            return res.render("backend/gusset/gussetList.html", {
                title: "Gusset Tracking",
                gussetManagement: "active",
                gussetMenuOpen: "menu-open",
 
                totalScans: totalScans,
                totalQrCodes: totalQrCodes,
                totalAdvertisers: totalAdvertisers,
                totalClicks: totalScans,
                totalBrands: totalBrands,
                records: viewRecords,
                user: req.session.admin,
                alias: "gusset",
            });
 
        } catch (error) {
            console.error("[gusset.view] Error:", error);
 
            return res.status(500).send("Unable to load Gusset Tracking");
        }
    };
 
 
    return module;
};