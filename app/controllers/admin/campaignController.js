const Sequelize = require("sequelize");
const { isArray } = require("jquery");
const { raw } = require("mysql");
const { assign } = require("nodemailer/lib/shared");
const { where } = require("sequelize");
const { log } = require("winston");
let Op = Sequelize.Op


module.exports = function (model) {

    var module = {};

    module.view = async function (request, response) {
        try {
            response.render('backend/campaign/campaignList', {
                title: 'Campaign Management',
                error: request.flash("error"),
                success: request.flash("success"),
                vErrors: request.flash("vErrors"),
                user: request.session.admin,
                campaignManagement: "active"
            });

        } catch (e) {
            request.flash("error", "Something went wrong. Please try again.");
            return response.redirect("/backend/dashboard");
        }
    };

    module.getCampaign = async function (request, response) {
        try {
            let start = parseInt(request.query.start);
            let length = parseInt(request.query.length);
            let search = request.query.search.value;
            let query = {};

            if (search != '') {
                query = {
                    [Op.or]: [
                        { 'campaignName': { [Op.like]: '%' + search + '%' } },
                    ]
                };
            } else {
                query = {};
            }

            let campaignCount = await model.Campaign.count({ where: query });
            let campaign = await model.Campaign.findAll({
                where: query,
                // raw : true,
                order: [["id", "DESC"]],
                offset: start,
                limit: length, /* raw: true */
            });


            let obj = {
                'draw': request.query.draw,
                'recordsTotal': campaignCount,
                'recordsFiltered': campaignCount,
                'data': campaign
            };
            return response.send(JSON.stringify(obj));
        } catch (error) {
            console.log("error in get users", error);
        }

    };

    module.createCampaign = async function (request, response) {
        try {
            let brand = await model.Brand.findAll({ raw: true });

            response.render('backend/campaign/addCampaign', {
                title: 'Campaign Management',
                error: request.flash("error"),
                success: request.flash("success"),
                vErrors: request.flash("vErrors"),
                user: request.session.admin,
                campaignManagement: "active",
                Brands: brand
            });

        } catch (e) {
            request.flash("error", "Something went wrong. Please try again.");
            return response.redirect("/backend/campaign");
        }
    }

    module.createCampaignPost = async function (request, response) {

        const { campaignName, bagsNo, couponNo, brand, status, expiryDate, startingDate } = request.body;

        try {
            // Validate input
            if (!campaignName || !brand) {
                return response.status(400).json({ message: "All fields are required." });
            }

            // Fetch brand details
            const brandDetails = await model.Brand.findOne({
                where: { id: brand, status: "active" },
            });

            if (!brandDetails) {
                // return res.status(404).json({ message: "Brand not found or inactive." });
                console.log("Brand not found");
                request.flash("error", "Brand not found");
                return response.redirect("/backend/campaign");
            }

            // Create the campaign
            const createCampaign = await model.Campaign.create({
                campaignId: generateNumbr(6),
                campaignName,
                status: status || "unpublished",
                bags: Number(bagsNo) || 0,
                coupons: Number(couponNo) || 0,
                expiryDate: expiryDate || null,
                startingDate: startingDate || null,
            });
            if (!createCampaign) {
                console.log("Campaign not created");
                request.flash("error", "Something went wrong. Please try again.");
                return response.redirect("/backend/campaign");
            }
            // Create CampaignBrandHistory entry
            let createCampaignBrandHistory = await model.CampaignBrandHistory.create({
                campaign_id: createCampaign.id,
                brand_id: brand,
            });
            if (!createCampaignBrandHistory) {
                request.flash("error", "Something went wrong. Please try again.");
                return response.redirect("/backend/campaign");
            }
            request.flash("success", "Successfully created campaign.");
            return response.redirect("/backend/campaign");
            // res.status(201).json({
            //     message: "Energy campaign created successfully.",
            //     campaignId: createCampaign.campaignId,
            //     productIds,
            // });
        } catch (error) {
            console.log("create campaign e - > ", error);
            request.flash("error", "Something went wrong. Please try again.");
            return response.redirect("/backend/campaign");
            // console.error("Error creating energy campaign:", error);
            // res.status(500).json({ message: "Internal server error." });
        }
    };

    module.updateCampaign = async function (request, response) {
        const { id: campaignId } = request.params

        const { campaignName, bagsNo, couponNo, brand, status, expiryDate } = request.body;
        try {
            if (!campaignId || !campaignName || !brand) {
                request.flash("error", "All fields are required.");
                return response.redirect("/backend/campaign");
            }
            const existingCampaign = await model.Campaign.findOne({ where: { id: campaignId } });

            if (!existingCampaign) {
                request.flash("error", "Campaign not found.");
                return response.redirect("/backend/campaign");
            }
            const brandDetails = await model.Brand.findOne({
                where: { id: brand, status: "active" },
            });

            if (!brandDetails) {
                request.flash("error", "Brand not found or inactive.");
                return response.redirect("/backend/campaign");
            }

            existingCampaign.campaignName = campaignName;
            existingCampaign.status = status || "unpublished";
            existingCampaign.bags = Number(bagsNo) || existingCampaign.bags || 0;
            existingCampaign.coupons = Number(couponNo) || existingCampaign.coupons || 0;
            existingCampaign.expiryDate = expiryDate || existingCampaign.expiryDate || null;
            await existingCampaign.save();
            request.flash("success", "Successfully updated campaign.");
            return response.redirect("/backend/campaign");

        } catch (error) {
            console.log("update campaign error ->", error);
            request.flash("error", "Something went wrong. Please try again.");
            return response.redirect("/backend/campaign");
        }
    };

    module.checkBrandCoupen = async function (request, response) {
        try {
            let { brandId, bags, type, couponNo } = request.body;
            bags = Number(bags) || 0;
            couponNo = Number(couponNo) || 1;
            const requiredCoupons = bags * couponNo;

            if (type == "brand") {

                let brandDetail = await model.Brand.findOne({
                    where: { id: brandId },
                    include: [
                        {
                            where: { status: "unused", assign_status: "unassigned" },
                            model: model.Coupon,
                            required: false,
                        },
                    ],
                });
                // console.log("brand coupen length --> ", brandDetail.coupons.length);
                if (requiredCoupons > brandDetail.coupons.length) {
                    return response.send({ status: "success", result: null, message: `You have not enought coupens in ${brandDetail.brandName}` });
                }

            } else if (type == "bag") {
                let brandDetail = await model.Brand.findAll({
                    where: { id: { [Op.in]: brandId } },
                    include: [
                        {
                            where: { status: "unused", assign_status: "unassigned" },
                            model: model.Coupon,
                            required: false,
                        },
                    ],
                });

                for (let i = 0; i < brandDetail.length; i++) {
                    const availableCoupons = brandDetail[i].coupons?.length || 0;
                    if (requiredCoupons > availableCoupons) {
                        return response.send({ status: "success", result: null, message: `You have not enought coupens in ${brandDetail[i].brandName}` });
                    }
                }
            }

            return response.send({ status: "failed", result: null })
        } catch (error) {
            console.log("checkBrandCoupen Error --> ", error);
            response.send({ status: "failed", message: "Something went wrong." })
        }
    }
    module.campaignDetail = async function (request, response) {
        let campaignId = request.params.id;
        if (campaignId != "" && campaignId != 0) {
            try {
                let campaignDetail = await model.Campaign.findOne({
                    where: { id: campaignId },
                });
                let campaignBrandHistory = await model.CampaignBrandHistory.findAll({
                    where: { campaign_id: campaignId },
                    include: [
                        {
                            model: model.Brand,
                            as: "brandDetails"
                        }
                    ]
                })

                campaignBrandHistory = JSON.stringify(campaignBrandHistory)
                campaignBrandHistory = JSON.parse(campaignBrandHistory)
                // console.log("-----------", campaignBrandHistory);
                const uniqueData = campaignBrandHistory.filter((item, index, self) =>
                    index === self.findIndex((t) => (
                        t.brand_id === item.brand_id && t.campaign_id === item.campaign_id
                    ))
                );
                const brandIds = uniqueData.map(item => item.brand_id);

                // Get bags for this campaign to find the coupons associated specifically with this campaign
                const bagRecords = await model.Bags.findAll({ where: { campaign_id: campaignId }, raw: true });
                const couponIds = bagRecords.map(b => b.coupon_id).filter(Boolean);

                let coupons = [];
                if (couponIds.length > 0) {
                    coupons = await model.Coupon.findAll({ where: { id: { [Op.in]: couponIds } }, raw: true });
                }

                let totalCoupons = coupons.length;
                let usedCoupons = coupons.filter(c => c.status == "used").length;
                let unUsedCoupons = coupons.filter(c => c.status != "used").length;


                response.render('backend/campaign/campaignDetail', {
                    title: 'View Brand',
                    error: request.flash("error"),
                    success: request.flash("success"),
                    vErrors: request.flash("vErrors"),
                    user: request.session.admin,
                    config: config,
                    campaignDetail,
                    campaignBrandHistory: uniqueData,
                    campaignManagement: "active",
                    totalCoupons,
                    usedCoupons,
                    unUsedCoupons
                });

            } catch (err) {
                console.log('Campaign view Error:', err);
                request.flash('error', "campaign detail not available.");
                response.redirect('/backend/campaign');
            }
        } else {
            request.flash('error', "campaign detail not available.");
            response.redirect('/backend/campaign');
        }
    }
    module.editCampaign = async function (request, response) {
        try {
            let campaign = await model.Campaign.findOne({ where: { id: request.params.id } })
            let getExpiryDate = await model.Bags.findOne({ where: { campaign_id: request.params.id }, raw: true })

            let brand = await model.Brand.findAll({ raw: true });
            let selectedBrands = await model.CampaignBrandHistory.findAll({ where: { campaign_id: request.params.id } })
            response.render('backend/campaign/editCampaign', {
                title: 'Edit Campaign',
                error: request.flash("error"),
                success: request.flash("success"),
                vErrors: request.flash("vErrors"),
                user: request.session.admin,
                alias: 'campaign',
                campaignManagement: "active",
                campaign,
                expiryDate: getExpiryDate ? getExpiryDate.expiryDate : "xx/xx/xxxx",
                brand,
                selectedBrands: selectedBrands
            });
        } catch (e) {
            console.log("editCampaign  Error", e);
            return new Error('editCampaign Error', e);
        }
    };
    module.getCampaingnDetais = async function (request, response) {
        try {
            let campaignId = request.query.campaignId;
            campaignId = parseInt(campaignId, 10);
            const campaign = await model.Campaign.findOne({ where: { id: campaignId }, raw: true });

            let campaignDetail = await model.CampaignBrandHistory.findAll({
                where: { campaign_id: campaignId },
                include: [
                    {
                        model: model.Brand,
                        as: "brandDetails"
                    },
                ]
            })
            // Fetch all bags for the campaign
            const data = await model.Bags.findAll({ where: { campaign_id: campaignId } });
            const mainArr = await Promise.all(
                data.map(async (item) => {
                    const { coupon_id, brand_id, productId } = item.dataValues;

                    // Fetch coupon details
                    const couponDetails = await model.Coupon.findOne({ where: { id: coupon_id } });
                    const couponCode = couponDetails ? couponDetails.couponCode : "-";
                    const status = couponDetails ? couponDetails.status : "-";
                    const qrCode = couponDetails ? couponDetails.qrCode : "";
                    const userName = couponDetails ? couponDetails.userName : "-";
                    const brandDetails = await model.Brand.findOne({ where: { id: brand_id } });
                    const brandName = brandDetails ? brandDetails.brandName : "-";
                    const campaignName = campaign ? campaign.campaignName : "-";

                    return {
                        couponCode,
                        productId,
                        brandName,
                        campaignName,
                        status,
                        qrCode,
                        userName
                    };
                })
            );
            campaignDetail ? response.send({ status: "success", result: mainArr }) : response.send({ status: "failed", result: null })
        } catch (e) {
            console.log("getCampaingnDetais  Error", e);
            return new Error('editCampaign Error', e);
        }
    };
    module.deleteCampaign = async function (request, response) {
        try {
            let campaign = await model.Campaign.findOne({ where: { id: request.params.id } });
            let deleteCampaign = await model.Campaign.destroy({ where: { id: request.params.id } });
            let deleteBag = await model.Bags.destroy({
                where: { campaign_id: request.params.id }
            })
            let campaignBrandHistory = await model.CampaignBrandHistory.destroy({
                where: { campaign_id: request.params.id }
            })
            request.flash('success', 'campaign Successfully deleted')
            response.redirect('/backend/campaign');
        } catch (error) {
            request.flash('error', 'Something went wrong')
            response.redirect('/backend/campaign');
        }
    };

    module.addCampaignBagCoupon = async function (req, res) {
        try {
            const { campaignId, bags, coupons, expiryDate, startingDate } = req.body;
            if (!campaignId || !bags || !coupons || !expiryDate || !startingDate) {
                return res.json({
                    success: false,
                    message: "All fields are required"
                });
            }
            await model.Campaign.update({ bags: bags, coupons: coupons, expiryDate: expiryDate, startingDate: startingDate }, { where: { id: campaignId } });
            return res.json({ success: true, message: "Updated Successfully" });
        } catch (err) {
            return res.json({ success: false, message: "Something went wrong" });
        }
    }

    module.campaignCouponDetail = async function (request, response) {
        let campaignId = request.query.campaignId;
        const campaignBrands = await model.CampaignBrandHistory.findAll({ where: { campaign_id: campaignId }, raw: true });
        const brandIds = campaignBrands.map(item => item.brand_id);
    }

    module.getCamaignCoupon = async function (request, response) {
        try {
            // console.log('getCamaignCoupon req body---', request.query);
            let start = parseInt(request.query.start);
            let length = parseInt(request.query.length);
            let search = request.query.search.value;
            let { campaignId } = request.query;
            let query = {};

            if (search != '') {
                query = {
                    [Op.or]: [
                        { 'campaignName': { [Op.like]: '%' + search + '%' } },
                    ]
                };
            } else {
                query = {};
            }
            // console.log("query: ", query);

            let campaign = await model.CampaignBrandHistory.findAll({ where: { campaign_id: campaignId }, raw: true });
            // console.log('campaign----', campaign);

            if (campaign.length) {

                let brandId = [];

                let bagsWithDetails = await model.Bags.findAll({
                    attributes: [
                        'product_id',
                        [Sequelize.col('coupenDetails.coupon_code'), 'coupon_code'],
                        [Sequelize.col('coupenDetails.id'), 'coupon_id'],
                        [Sequelize.col('brandDetails.brand_name'), 'brand_name'],
                        [Sequelize.col('brandDetails.id'), 'brand_id'],
                        [Sequelize.col('campaignDetails.status'), 'camaign_status'],
                        ['created_at', 'first_created_at'],
                        ['updated_at', 'last_updated_at'],
                    ],
                    include: [
                        {
                            model: model.Coupon,
                            as: 'coupenDetails',
                            attributes: [],
                        },
                        {
                            model: model.Brand,
                            as: 'brandDetails',
                            attributes: [],
                        },
                        {
                            model: model.Campaign,
                            as: 'campaignDetails',
                            attributes: [],
                        }
                    ],
                    where: {
                        campaign_id: campaignId
                    },
                    order: [
                        ['product_id', 'ASC'],
                        [Sequelize.col('coupenDetails.id'), 'ASC'],
                        [Sequelize.col('brandDetails.id'), 'ASC']
                    ], raw: true
                })
                // console.log("bagsWithDetails21212------", JSON.stringify(bagsWithDetails));

                bagsWithDetails = JSON.stringify(bagsWithDetails)
                bagsWithDetails = JSON.parse(bagsWithDetails)

                const transformedData = bagsWithDetails.reduce((acc, curr) => {
                    // console.log("curr --> ", curr);
                    let found = acc.find(item => item.product_id === curr.product_id);
                    // console.log(" --> ", found);
                    if (!found) {
                        // console.log("If");
                        found = {
                            product_id: curr.product_id,
                            coupon_id: curr.coupon_id,
                            status: curr.camaign_status,

                        };
                        acc.push(found);
                    }

                    found[`${curr.brand_name}_coupon_code`] = curr.coupon_code;
                    // console.log("------------");
                    return acc;
                }, []);
                // console.log("transformedData --> ", transformedData);
                // SELECT bgm.product_id, cm.coupon_code, cm.id AS coupon_id, bm.brand_name, bm.id AS brand_id, bgm.created_at AS first_created_at, bgm.updated_at AS last_updated_at FROM bags_masters bgm LEFT JOIN coupons cm ON cm.id= bgm.coupon_id LEFT JOIN brand_masters bm ON bm.id= bgm.brand_id WHERE bgm.campaign_id = 1 ORDER BY bgm.product_id, cm.id, bm.id;

                let obj = {
                    'draw': request.query.draw,
                    'recordsTotal': transformedData.length,
                    'recordsFiltered': transformedData.length,
                    'data': transformedData
                };
                return response.send(JSON.stringify(obj));

            } else {
                request.flash('error', "Campaign not found.");
                return response.redirect('/backend/campaign');
            }
        } catch (error) {
            console.log("getCamaignCoupon error --> ", error);
            request.flash('error', "Something went wrong.");
            return response.redirect('/backend/campaign');
        }

    };

    return module;
}

function generateNumbr(length) {
    const characters = '1234567890';
    let result = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
    }

    return result;
}

function arraysHaveSameElements(arr1, arr2) {
    // First, check if arrays have the same length
    if (arr1.length !== arr2.length) {
        return false;
    }

    // Sort both arrays and compare element by element
    let sortedArr1 = arr1.slice().sort(); // slice() to avoid mutating the original array
    let sortedArr2 = arr2.slice().sort();

    for (let i = 0; i < sortedArr1.length; i++) {
        if (sortedArr1[i] !== sortedArr2[i]) {
            return false;
        }
    }

    // If all elements match, return true
    return true;
}