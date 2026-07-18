const { raw } = require("mysql");
let Op = Sequelize.Op;
let path = require("path");
let fs = require("fs");
const csv = require("csv-parser");
const XLSX = require("xlsx");
const QRCode = require("qrcode");
const { log } = require("winston");
const { stringify } = require("querystring");
const { where, json } = require("sequelize");
const { fail } = require("assert");

module.exports = function (model) {
  var module = {};

  module.view = async function (request, response) {
    try {
      // console.log("cmsController get user page", req.session.details);
      response.render("backend/brand/brandList", {
        title: "Brand Management",
        error: request.flash("error"),
        success: request.flash("success"),
        vErrors: request.flash("vErrors"),
        user: request.session.admin,
        alias: "brand",
        brandManagement: "active",
      });
    } catch (e) {
      console.log("getBrand  Error", e);
      return new Error("getBrand  Error", e);
    }
  };
  module.getBrand = async function (request, response) {
    try {
      // console.log('getBrand req body---', request.body);
      let start = parseInt(request.query.start);
      console.log("🚀 ~ start:", start);
      let length = parseInt(request.query.length);
      console.log("🚀 ~ length:", length);
      let search = request.query.search.value;
      console.log("🚀 ~ search:", search);
      let query = {};
      console.log("🚀 ~ query:", query);

      if (search != "") {
        query = {
          [Op.or]: [{ brandName: { [Op.like]: "%" + search + "%" } }],
        };
      } else {
        query = {};
      }

      // console.log("query: ", query);
      let brandCount = await model.Brand.count({ where: query });
      let brand = await model.Brand.findAll({
        where: query,
        include: [
          {
            model: model.Coupon,
          },
        ],
        // raw : true,
        order: [["id", "DESC"]],
        offset: start,
        limit: length /* raw: true */,
      });
      //   await brand.map(async(i)=>{
      //     if(i){
      //         console.log("🚀 ~ awaitbrand.map ~ i:", i)

      //     }
      //   })
      let obj = {
        draw: request.query.draw,
        recordsTotal: brandCount,
        recordsFiltered: brandCount,
        data: brand,
      };
      //   console.log("obj",JSON.stringify(obj));
      return response.send(JSON.stringify(obj));
    } catch (error) {
      console.log("error in get users", error);
    }
  };
  module.addBrand = async function (request, response) {
    try {
      response.render("backend/brand/addBrand", {
        title: "Add Brand",
        error: request.flash("error"),
        success: request.flash("success"),
        vErrors: request.flash("vErrors"),
        user: request.session.admin,
        alias: "brand",
        brandManagement: "active",
      });
    } catch (error) {
      console.log("addBrand Error", error);
      return request.flash("success", "Something went wrong.");
    }
  };
  module.addBrandPost = async function (req, res) {
    try {
      // console.log("addBrandPost body --> ", req.body);
      // console.log("req.files --- >", req.files);

      let customImage = "";

      let addData = {
        brandName: req.body.brandName,
        status: req.body.status,
      };
      if (req.files && req.files.picture__input) {
        let image = req.files.picture__input;
        let re = /(?:\.([^.]+))?$/;
        let ext = re.exec(image.name)[1];
        customImage = Date.now() + "." + ext;
        image.mv(
          "./public/dist/brandLogo/" + customImage,
          async function (err) {
            if (err) {
              console.log("err", err);
              req.flash("error", "Error uploading in game image");
              return res.redirect("/backend/addBrand");
            }
          }
        );
        addData.brandLogo = "/dist/brandLogo/" + customImage;
      }

      // console.log('Final addData  ---->', addData);

      await model.Brand.create(addData);

      req.flash("success", "Brand Successfully added");
      res.redirect("/backend/brand");
    } catch (e) {
      console.log("addPostGame game Error", e);
      return new Error("addPostGame game Error", e);
    }
  };
  module.editBrand = async function (request, response) {
    try {
      // console.log("editBrand data", request.params);
      let brand = await model.Brand.findOne({
        where: { id: request.params.id },
      });
      // console.log("editBrand", brand);
      response.render("backend/brand/addBrand", {
        error: request.flash("error"),
        success: request.flash("success"),
        vErrors: request.flash("vErrors"),
        user: request.session.admin,
        alias: "brand",
        brandManagement: "active",
        brand,
      });
    } catch (e) {
      console.log("editBrand  Error", e);
      return new Error("editBrand Error", e);
    }
  };
  module.updateBrand = async function (request, response) {
    try {
      // console.log("updateBrand data", request.body);
      let brand = await model.Brand.findOne({
        where: { id: request.params.id },
        raw: true,
      });
      // console.log("updateBrand", brand);
      let addData = {
        brandName: request.body.brandName,
        status: request.body.status,
      };

      // console.log("request.files --- >", request.files);
      if (request.files && request.files.picture__input) {
        let image = request.files.picture__input;
        let re = /(?:\.([^.]+))?$/;
        let ext = re.exec(image.name)[1];
        customImage = Date.now() + "." + ext;
        image.mv(
          "./public/dist/brandLogo/" + customImage,
          async function (err) {
            if (err) {
              console.log("err", err);
              request.flash("error", "Error uploading in game image");
              return res.redirect("/backend/addBrand");
            }
          }
        );
        addData.brandLogo = "/dist/brandLogo/" + customImage;
      }

      let result = await model.Brand.update(addData, {
        where: {
          id: request.params.id,
        },
      });
      // console.log("updateBrand result", result);
      if (result) {
        request.flash("success", "Brand updated successfully");
        response.redirect("/backend/brand");
      } else {
        request.flash("error", "Brand update failed");
        response.redirect("/backend/editBrand/" + request.params.id);
      }
    } catch (e) {
      console.log("updateBrand Error", e);
      return new Error("updateBrand Error", e);
    }
  };
  module.deleteBrand = async function (request, response) {
    try {
      // console.log("deleteBrand  ---> ", request.params.id);
      let brand = await model.Brand.findOne({
        where: { id: request.params.id },
      });
      // console.log("brand----", brand);
      if (brand) {
        if (brand.brandLogo) {
          fs.unlink("./public/" + brand.brandLogo, (err) => {
            if (err) {
              console.error("Error deleting image:", err);
            } else {
              console.log("Image deleted successfully");
            }
          });
        }
        let deletebrand = await model.Brand.destroy({
          where: { id: request.params.id },
        });
        // console.log("deleted---", deletebrand);
        request.flash("success", "Brand Successfully added");
        response.redirect("/backend/brand");
      } else {
        request.flash("error", "Something went wrong");
        response.redirect("/backend/brand");
      }
    } catch (error) {
      request.flash("error", "Something went wrong");
      response.redirect("/backend/brand");
    }
  };
  module.brandDetail = async function (request, response) {
    // console.log("detail---", request.params);
    let brandId = request.params.id;
    if (brandId != "" && brandId != 0) {
      try {
        let brandDetail = await model.Brand.findOne({
          where: { id: brandId },
          include: [
            {
              model: model.Coupon,
            },
          ],
        });
        // console.log("brandDetail -->", brandDetail.coupons);
        let totalCoupons = brandDetail.coupons.length;
        console.log("totalCoupons---", totalCoupons);
        let usedCoupons = 0;
        let unUsedCoupons = 0;
        if (brandDetail.coupons.length) {
          brandDetail.coupons.forEach((coupon) => {
            console.log("coupon --> ", coupon);
            if (coupon) {
              if (coupon.status == "used") {
                usedCoupons++;
              } else {
                unUsedCoupons++;
              }
            }
          });
        }
        console.log("usedCoupons---", usedCoupons);
        console.log("unUsedCoupons---", unUsedCoupons);
        if (brandDetail != null) {
          response.render("backend/brand/brandDetail", {
            title: "View Brand",
            error: request.flash("error"),
            success: request.flash("success"),
            vErrors: request.flash("vErrors"),
            user: request.session.admin,
            config: config,
            brandDetail: brandDetail,
            totalCoupons,
            usedCoupons,
            unUsedCoupons,
            alias: "Brand",
            brandManagement: "active",
          });
        } else {
          request.flash("error", "brand detail not available.");
          response.redirect("/backend/brand");
        }
      } catch (err) {
        console.log("brand edit Error:", err);
        request.flash("error", "brand detail not available.");
        response.redirect("/backend/brand");
      }
    } else {
      request.flash("error", "brand detail not available.");
      response.redirect("/backend/brand");
    }
  };
  module.brandCouponDetail = async function (request, response) {
    try {
      // console.log('getBrand req body--->>>', request.query);
      let start = parseInt(request.query.start);
      let length = parseInt(request.query.length);
      // let search = request.query.search.value;
      let query = { id: request.query.brandId };
      let selectedValue = request.query.selectedVal;
      // console.log("selectedValue -->", selectedValue);

      selectedValue = selectedValue == "all" ? "" : selectedValue;
      // console.log("selectedValue 2 -->", selectedValue);
      // if (search != '') {
      //     query = {
      //         [Op.or]: [
      //             { 'couponCode': { [Op.like]: '%' + search + '%' } },
      //         ]
      //     };
      // }

      // console.log("query: ", query);
      let brand = await model.Brand.findOne({
        where: query,
      });
      if (!brand) {
        return response
          .status(404)
          .send(JSON.stringify({ message: "Brand not found" }));
      }

      const campaign_id = brand.campaign_id;
      let include = [
        {
          model: model.Coupon,
          where: selectedValue ? { status: selectedValue } : {},
          required: false,
          offset: start,
          limit: length,
        },
      ];

      if (campaign_id) {
        include.push({
          model: model.Campaign,
          as: "campaignDetails",
        });
      }

      // if (campaign_id) {
      //     include = [
      //         {
      //             model: model.Coupon,
      //             where: selectedValue ? { status: selectedValue } : {},
      //             required: false,
      //             offset: start,
      //             limit: length,
      //         },
      //         {
      //             model: model.Campaign,
      //             as: 'campaignDetails',
      //         }
      //     ]
      // } else {
      //     include = [
      //         {
      //             model: model.Coupon,
      //             where: selectedValue ? { status: selectedValue } : {},
      //             required: false,
      //             offset: start,
      //             limit: length,
      //         },
      //     ]
      // }
      let array = [];
      const brandDetailWithCampaign = await model.Brand.findOne({
        where: query,
        include: include,
        order: [["id", "DESC"]],
      });
      await Promise.all(
        await brandDetailWithCampaign.coupons.map(async (i) => {
          // console.log("couponId",i.id);
          if (i.id) {
            // console.log("model",model);
            let bag = await model.Bags.findOne({
              where: { coupon_id: i.id, brand_id: i.brand_id },
            });
            if (bag && bag.campaign_id) {
              let campaignDetailss = await model.Campaign.findOne({
                where: { id: bag.campaign_id },
              });
              let Name = "-";
              // console.log("--------------------------------------------------------i",i);
              
              if (i.dataValues.user_id) {
                let userData = await model.User.findOne({
                  where: { id: i.dataValues.user_id },raw:true
                });
                // console.log("userData",userData);
                
                if (userData) {
                  i.dataValues.userName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim();
                }
              }
              i.dataValues.campaignName =
                campaignDetailss && campaignDetailss.campaignName
                  ? campaignDetailss.campaignName
                  : "";
                       }
          }
        })
      );

      const brandCoupen = await model.Brand.findOne({
        where: query,
        include: [
          {
            model: model.Coupon,
            where: selectedValue ? { status: selectedValue } : {},
            required: false,
          },
        ],
        order: [["id", "DESC"]],
      });
console.log("------------------------brandDetailWithCampaign.coupons",brandDetailWithCampaign.coupons);

      let obj = {
        draw: request.query.draw,
        recordsTotal: brandCoupen.coupons.length,
        recordsFiltered: brandCoupen.coupons.length,
        data: brandDetailWithCampaign.coupons,
      };
      return response.send(JSON.stringify(obj));
    } catch (error) {
      console.log("error in get users", error);
    }
  };
  module.addCoupon = async function (request, response) {
    try {
      const brandId = request.body.brandId || request.query.brandId;
      const mode = request.body.mode || "manual";
      if (!brandId) { return response.status(400).json({ success: false, message: "Brand id is required." }); }
      let manualCoupons = [];
      if (mode === "manual") {
        manualCoupons = Array.isArray(request.body.coupons) ? request.body.coupons : [];
      } else {
        return response.status(400).json({ success: false, message: "Invalid mode selected." });
      }
      if (!manualCoupons.length) { return response.status(400).json({ success: false, message: "Please add at least one coupon." }); }
      const existingCoupons = await model.Coupon.findAll({ where: { brand_id: brandId }, attributes: ["couponCode"], raw: true, });
      const existingSet = new Set(existingCoupons.map((coupon) => String(coupon.couponCode).toUpperCase()));
      const uniqueCoupons = [];
      const seen = new Set();
      for (const item of manualCoupons) {
        const normalizedCode = String(item.couponCode || "").trim();
        const key = normalizedCode.toUpperCase();
        if (!normalizedCode || seen.has(key) || existingSet.has(key)) {
          continue;
        }
        seen.add(key);
        uniqueCoupons.push({
          couponCode: normalizedCode,
          title: String(item.title || ""),
          description: String(item.description || ""),
          brand_id: brandId,
          userId: null,
          assignStatus: "unassigned",
          status: "unused",
          expiryDate: request.body.expiryDate,
          startingDate: request.body.startingDate,
        });
      }
      if (!uniqueCoupons.length) {
        return response.status(400).json({ success: false, message: "No valid or unique coupon codes were provided." });
      }
      const updatedCoupons = await Promise.all(
        uniqueCoupons.map(async (coupon) => {
          const qrLink = `${process.env.BASE_URL}/coupon/${coupon.couponCode}`;
          return {
            ...coupon,
            expiryDate: request.body.expiryDate,
            startingDate: request.body.startingDate,
            qrCode: await generateCouponQrPath(qrLink),
          };
        })
      );
      const insertedCoupons = await model.Coupon.bulkCreate(updatedCoupons);
      const totalBagCount = Number(request.body.bags || request.body.bagsNo || 0);
      const couponCount = Array.isArray(request.body.coupons) ? request.body.coupons.length : Number(request.body.coupons || 0);
      let couponsPerBag = Number(request.body.couponNo || 0);
      if (!couponsPerBag && totalBagCount > 0 && couponCount > 0) {
        couponsPerBag = Math.ceil(couponCount / totalBagCount);
      }
      const bagProductIds = createBagProductIds(request.body.productId, totalBagCount);
      const bagRecords = insertedCoupons.map((coupon, index) => {
        const bagIndex = couponsPerBag > 0 ? Math.min(Math.floor(index / couponsPerBag), totalBagCount - 1) : 0;
        return {
          campaign_id: request.body.campaignId,
          brand_id: brandId,
          coupon_id: coupon.id,
          bagName: `Bag${bagIndex + 1}`,
          productId: bagProductIds.length ? bagProductIds[bagIndex] : request.body.productId,
          expiryDate: request.body.expiryDate,
          startingDate: request.body.startingDate,
          status: 0,
          isExpired: 0,
        };
      });
      await model.Bags.bulkCreate(bagRecords);
      if (request.body.campaignId) {
        const campaignUpdate = { status: 'published' };
        const totalBagCount = Number(request.body.bags || request.body.bagsNo || 0);
        const totalCouponCount = Number(request.body.coupons || request.body.couponNo || insertedCoupons.length);
        if (totalBagCount > 0) campaignUpdate.bags = totalBagCount;
        campaignUpdate.coupons = totalCouponCount;
        if (request.body.expiryDate !== undefined) campaignUpdate.expiryDate = request.body.expiryDate;
        if (request.body.startingDate !== undefined) campaignUpdate.startingDate = request.body.startingDate;
        await model.Campaign.update(campaignUpdate, { where: { id: request.body.campaignId } });
      }
      return response.json({
        success: true, message: `Added ${updatedCoupons.length} coupon(s).`,
      });
    } catch (error) {
      console.log("Error in addCoupon", error);
      return response
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  };

  module.uploadCoupon = async function (request, response) {
    try {
      // console.log("request.file----", request.files, request.query);
      const file = request.files;
      if (!file) {
        return response
          .status(400)
          .json({ success: false, message: "No file uploaded" });
      }

      const brandId = request.body.brandId || request.query.brandId;
      if (!brandId) {
        return response
          .status(400)
          .json({ success: false, message: "Brand id is required." });
      }

      const fileExtension = path.extname(file.file.name).toLowerCase();
      const coupons = [];

      if (fileExtension === ".csv") {
        parseCSVFile(file, [], async (error, result) => {
          if (error) {
            return response.json({ success: false, message: error.message });
          }

          const parsedCoupons = result.coupons || [];
          const expectedCount = Number(request.body.bags) * Number(request.body.coupons);
          if (expectedCount > 0 && parsedCoupons.length !== expectedCount) {
            return response.json({
              success: false,
              message: `Please upload exactly ${expectedCount} coupons. Found ${parsedCoupons.length}.`,
            });
          }

          const updatedCoupons = await Promise.all(
            parsedCoupons.map(async (coupon) => {
              const qrLink = `${process.env.BASE_URL}/coupon/${coupon.couponCode}`;
              return {
                ...coupon,
                brand_id: brandId,
                expiryDate: request.body.expiryDate,
                startingDate: request.body.startingDate,
                qrCode: await generateCouponQrPath(qrLink),
              };
            })
          );

          const insertedCoupons = await model.Coupon.bulkCreate(updatedCoupons);
          const totalBagCount = Number(request.body.bags || request.body.bagsNo || 0);
          const couponsPerBag = Number(request.body.coupons || request.body.couponNo || 0);
          const bagProductIds = createBagProductIds(request.body.productId, totalBagCount);
          const bagRecords = insertedCoupons.map((coupon, index) => {
            const bagIndex = couponsPerBag > 0 ? Math.min(Math.floor(index / couponsPerBag), totalBagCount - 1) : 0;
            return {
              campaign_id: request.body.campaignId,
              brand_id: brandId,
              coupon_id: coupon.id,
              bagName: `Bag${bagIndex + 1}`,
              productId: bagProductIds.length ? bagProductIds[bagIndex] : request.body.productId,
              expiryDate: request.body.expiryDate,
              startingDate: request.body.startingDate,
              status: false,
              isExpired: false,
            };
          });
          try {
            await model.Bags.bulkCreate(bagRecords);
            if (request.body.campaignId) {
              const campaignUpdate = { status: 'published' };
              const totalBagCount = Number(request.body.bags || request.body.bagsNo || 0);
              const totalCouponCount = Number(request.body.coupons || request.body.couponNo || insertedCoupons.length);
              if (totalBagCount > 0) campaignUpdate.bags = totalBagCount;
              campaignUpdate.coupons = totalCouponCount;
              if (request.body.expiryDate !== undefined) campaignUpdate.expiryDate = request.body.expiryDate;
              if (request.body.startingDate !== undefined) campaignUpdate.startingDate = request.body.startingDate;
              await model.Campaign.update(campaignUpdate, { where: { id: request.body.campaignId } });
            }
          } catch (bagError) {
            return response.json({ success: false, message: "Error inserting bag records." });
          }
          return response.json({ success: true });
        });
      } else if (fileExtension === ".xls" || fileExtension === ".xlsx") {
        // console.log("fileExtension--", fileExtension,);
        let couponbulk = await parseExcelFile(file, coupons);
        // console.log("couponbulk -> ", couponbulk);

        if (couponbulk.status == "success") {
          const parsedCoupons = couponbulk.coupons || [];
          const expectedCount = Number(request.body.bags) * Number(request.body.coupons);
          if (expectedCount > 0 && parsedCoupons.length !== expectedCount) {
            return response.json({
              success: false,
              message: `Please upload exactly ${expectedCount} coupons. Found ${parsedCoupons.length}.`,
            });
          }
          const updatedCoupons = await Promise.all(
            parsedCoupons.map(async (coupon) => {
              const qrLink = `${process.env.BASE_URL}/coupon/${coupon.couponCode}`;
              return {
                ...coupon,
                brand_id: brandId,
                expiryDate: request.body.expiryDate,
                startingDate: request.body.startingDate,
                qrCode: await generateCouponQrPath(qrLink),
              };
            })
          );

          const insertedCoupons = await model.Coupon.bulkCreate(updatedCoupons);
          const totalBagCount = Number(request.body.bags || request.body.bagsNo || 0);
          const couponsPerBag = Number(request.body.coupons || request.body.couponNo || 0);
          const bagProductIds = createBagProductIds(request.body.productId, totalBagCount);
          const bagRecords = insertedCoupons.map((coupon, index) => {
            const bagIndex = couponsPerBag > 0 ? Math.min(Math.floor(index / couponsPerBag), totalBagCount - 1) : 0;
            return {
              campaign_id: request.body.campaignId,
              brand_id: brandId,
              coupon_id: coupon.id,
              bagName: `Bag${bagIndex + 1}`,
              productId: bagProductIds.length ? bagProductIds[bagIndex] : request.body.productId,
              expiryDate: request.body.expiryDate,
              startingDate: request.body.startingDate,
              status: false,
              is_expired: false,
            };
          });
          console.log('DEBUG XLS: creating bagRecords sample', JSON.stringify(bagRecords.slice(0, 5), null, 2));
          await model.Bags.bulkCreate(bagRecords);
          if (request.body.campaignId) {
            const campaignUpdate = { status: 'published' };
            const totalBagCount = Number(request.body.bags || request.body.bagsNo || 0);
            const totalCouponCount = Number(request.body.coupons || request.body.couponNo || insertedCoupons.length);
            if (totalBagCount > 0) campaignUpdate.bags = totalBagCount;
            campaignUpdate.coupons = totalCouponCount;
            if (request.body.expiryDate !== undefined) campaignUpdate.expiryDate = request.body.expiryDate;
            if (request.body.startingDate !== undefined) campaignUpdate.startingDate = request.body.startingDate;
            await model.Campaign.update(campaignUpdate, { where: { id: request.body.campaignId } });
          }

          return response.json({ success: true });
        } else {
          return response.json({ success: false, message: couponbulk.message });
        }
      } else {
        console.log("Invalid file type----");
        return response
          .status(400)
          .json({ success: false, message: "Format is Not Valid" });
      }
    } catch (error) {
      console.log("Error:", error);
      return response
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  };


  module.openCoupon = async function (req, res) {
    try {
      const couponCode = req.params.couponCode;
      const playStoreUrl = "https://play.google.com/store/apps/details?id=com.bagvertising";
      const intentUrl = `intent://coupon/${couponCode}` + `#Intent;scheme=bagvertising;` + `package=com.bagvertising;` + `S.browser_fallback_url=${encodeURIComponent(playStoreUrl)};end`;
      return res.redirect(intentUrl);
    } catch (error) {
      console.log(error);
      return res.send("Invalid Coupon");
    }
  };

  return module;
};

function createBagProductIds(baseProductId, bagCount) {
  const count = Number(bagCount) || 0;
  if (count <= 0) {
    return [];
  }

  const ids = new Set();
  while (ids.size < count) {
    ids.add(generateRandomNumericId(8));
  }

  return Array.from(ids);
}

function generateRandomNumericId(length = 8) {
  const digits = "0123456789";
  let result = "";
  while (result.length < length) {
    result += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return result.slice(0, length);
}

async function generateCouponQrPath(couponCode) {
  const qrDirectory = path.join(__dirname, "../../../public/dist/qr_codes");
  if (!fs.existsSync(qrDirectory)) {
    fs.mkdirSync(qrDirectory, { recursive: true });
  }
  const safeCouponCode = couponCode.toString().trim().replace(/[^a-zA-Z0-9-_\.]/g, "_").slice(0, 100);
  const fileName = `${Date.now()}_${safeCouponCode}.png`;
  const filePath = path.join(qrDirectory, fileName);
  const publicPath = `/dist/qr_codes/${fileName}`;
  await QRCode.toFile(filePath, couponCode, { type: "png", width: 300, });
  return publicPath;
}

function normalizeCouponEntry(row) {
  const couponCode = String(
    row?.["Coupon Code"] || row?.couponCode || row?.["couponCode"] || ""
  ).trim();

  if (!couponCode) {
    return null;
  }

  return {
    couponCode,
    title: String(row?.title || row?.["Title"] || row?.["title"] || "").trim(),
    description: String(
      row?.description || row?.["Description"] || row?.["description"] || ""
    ).trim(),
  };
}

function collectUniqueCoupons(rows) {
  const uniqueCoupons = [];
  const seenCodes = new Set();

  for (const row of rows || []) {
    const normalizedCoupon = normalizeCouponEntry(row);
    if (!normalizedCoupon) {
      continue;
    }

    const key = normalizedCoupon.couponCode.toUpperCase();
    if (seenCodes.has(key)) {
      continue;
    }

    seenCodes.add(key);
    uniqueCoupons.push(normalizedCoupon);
  }

  return uniqueCoupons;
}

function parseCSVFile(file, coupons, callback) {
  const stream = require("stream");
  const bufferStream = new stream.PassThrough();
  bufferStream.end(file.file.data);

  let hasValidCoupons = false;
  let hasErrorOccurred = false; // Flag to prevent multiple error returns

  bufferStream
    .pipe(csv())
    .on("data", (row) => {
      if (hasErrorOccurred) return;

      const normalizedCoupon = normalizeCouponEntry(row);
      if (!normalizedCoupon) {
        return;
      }

      const existing = coupons.some(
        (item) => item.couponCode.toUpperCase() === normalizedCoupon.couponCode.toUpperCase()
      );
      if (!existing) {
        coupons.push(normalizedCoupon);
        hasValidCoupons = true;
      }
    })
    .on("end", () => {
      if (!hasErrorOccurred) {
        // If no error occurred, proceed
        if (hasValidCoupons) {
          callback(null, {
            status: "success",
            message: "Coupons parsed successfully",
            coupons: coupons,
          });
        } else {
          callback(
            {
              status: "failed",
              message: "No valid coupon codes found in the CSV file",
            },
            null
          );
        }
      }
    })
    .on("error", (error) => {
      if (!hasErrorOccurred) {
        // Only call the callback if no previous error
        hasErrorOccurred = true; // Set the flag to prevent multiple error callbacks
        callback(
          {
            status: "failed",
            message: "Error while parsing CSV file",
            error: error,
          },
          null
        ); // Pass error to callback
      }
    });
}

function parseExcelFile(file, coupons) {
  const workbook = XLSX.read(file.file.data, { type: "buffer" });
  console.log("workbook---", JSON.stringify(workbook));
  const sheetName = workbook.SheetNames[0];
  const worksheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
  const uniqueCoupons = collectUniqueCoupons(worksheet);

  if (!uniqueCoupons.length) {
    return { status: "fail", message: "No valid coupon codes found in the Excel file" };
  }
  return { status: "success", coupons: uniqueCoupons, message: "Coupons parsed successfully" };
}
