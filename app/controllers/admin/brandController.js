const { raw } = require("mysql");
let Op = Sequelize.Op;
let path = require("path");
let fs = require("fs");
const csv = require("csv-parser");
const XLSX = require("xlsx");
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
        order: [["id", "DESC"]],
        offset: start,
        limit: length,
      });

      const brandWithCouponStatus = await Promise.all(
        brand.map(async (brandItem) => {
          if (!brandItem.coupons || !brandItem.coupons.length) {
            return brandItem;
          }

          await Promise.all(
            brandItem.coupons.map(async (coupon) => {
              if (!coupon) {
                return;
              }
              const usageRecord = await model.CouponRecords.findOne({
                where: { couponId: coupon.id },
                raw: true,
              });
              coupon.dataValues.status = usageRecord ? "used" : "unused";
              coupon.status = usageRecord ? "used" : "unused";
            })
          );

          return brandItem;
        })
      );

      let obj = {
        draw: request.query.draw,
        recordsTotal: brandCount,
        recordsFiltered: brandCount,
        data: brandWithCouponStatus,
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
        let usedCoupons = 0;
        let unUsedCoupons = 0;
        if (brandDetail.coupons.length) {
          await Promise.all(
            brandDetail.coupons.map(async (coupon) => {
              if (!coupon) {
                return;
              }
              const usedRecord = await model.CouponRecords.findOne({
                where: { couponId: coupon.id },
                raw: true,
              });
              if (usedRecord) {
                usedCoupons++;
              } else {
                unUsedCoupons++;
              }
            })
          );
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
      const allCoupons = await Promise.all(
        brandDetailWithCampaign.coupons.map(async (i) => {
          if (!i.id) {
            return i;
          }
          let bag = await model.Bags.findOne({
            where: { coupon_id: i.id, brand_id: i.brand_id },
          });
          if (bag && bag.campaign_id) {
            let campaignDetailss = await model.Campaign.findOne({
              where: { id: bag.campaign_id },
            });
            if (campaignDetailss) {
              i.dataValues.campaignName = campaignDetailss.campaignName || "";
            }
          }

          const usageRecord = await model.CouponRecords.findOne({
            where: { couponId: i.id },
            raw: true,
          });
          if (usageRecord) {
            i.dataValues.status = "used";
            if (usageRecord.userId) {
              const userData = await model.User.findOne({
                where: { id: usageRecord.userId },
                raw: true,
              });
              if (userData) {
                i.dataValues.userName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim();
              } else {
                i.dataValues.userName = "-";
              }
            } else {
              i.dataValues.userName = "-";
            }
          } else {
            i.dataValues.status = "unused";
            i.dataValues.userName = "-";
          }
          return i;
        })
      );

      let filteredCoupons = allCoupons;
      if (selectedValue && selectedValue !== "all") {
        filteredCoupons = allCoupons.filter((coupon) => coupon.dataValues.status === selectedValue);
      }

      let obj = {
        draw: request.query.draw,
        recordsTotal: filteredCoupons.length,
        recordsFiltered: filteredCoupons.length,
        data: filteredCoupons,
      };
      return response.send(JSON.stringify(obj));
    } catch (error) {
      console.log("error in get users", error);
    }
  };

async function generateProductQrPath(qrContent, productId) {
    const QRCode = require("qrcode");
    const qrDirectory = path.join(__dirname, "../../../public/dist/qr_codes");
    if (!fs.existsSync(qrDirectory)) {
      fs.mkdirSync(qrDirectory, { recursive: true });
    }
    const safeProductId = String(productId).replace(/[^a-zA-Z0-9_-]/g, "_");
    const fileName = `${Date.now()}_product_${safeProductId}.png`;
    const filePath = path.join(qrDirectory, fileName);
    await QRCode.toFile(filePath, qrContent, {
      type: "png",
      width: 300,
    });
    return `/dist/qr_codes/${fileName}`;
  }

  function saveCouponImage(base64Image) {
    if (!base64Image.startsWith("data:image")) {
        return base64Image;
    }
    const matches = base64Image.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) return "";
    const ext = matches[1];
    const data = matches[2];
    const uploadDir = path.join(__dirname, "../../../public/dist/coupon_images");
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    const fileName = Date.now() + "." + ext;
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, Buffer.from(data, "base64"));
    return "/dist/coupon_images/" + fileName;
  }
  module.addCoupon = async function (request, response) {
    try {
      const brandId = request.body.brandId || request.query.brandId;
      const mode = request.body.mode || "manual";
      const couponStatus = String(request.body.couponStatus || request.body.status || "unused").trim() || "unused";
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
        const imagePath = saveCouponImage(item.couponImage);
        uniqueCoupons.push({
          couponCode: normalizedCode,
          title: String(item.title || ""),
          description: String(item.description || ""),
          couponImage: imagePath,
          brand_id: brandId,
          userId: null,
          assignStatus: "unassigned",
          status: couponStatus,
          expiryDate: request.body.expiryDate,
          startingDate: request.body.startingDate,
        });
      }
      if (!uniqueCoupons.length) {
        return response.status(400).json({ success: false, message: "No valid or unique coupon codes were provided." });
      }
      const updatedCoupons = uniqueCoupons.map((coupon) => ({
        ...coupon,
        expiryDate: request.body.expiryDate,
        startingDate: request.body.startingDate,
      }));
      const insertedCoupons = await model.Coupon.bulkCreate(updatedCoupons);
      const totalBagCount = Number(request.body.bags || request.body.bagsNo || 0);
      const bagProductIds = createBagProductIds(request.body.productId, totalBagCount);
      const bagRecords = [];
      for (let bagIndex = 0; bagIndex < totalBagCount; bagIndex++) {
          const productId = bagProductIds.length ? bagProductIds[bagIndex] : request.body.productId;
          const qrLink = `${process.env.BASE_URL}/coupon/${productId}`;
          const productQrCode = await generateProductQrPath(qrLink, productId);
          insertedCoupons.forEach((coupon) => {
              bagRecords.push({
                  campaign_id: request.body.campaignId,
                  brand_id: brandId,
                  coupon_id: coupon.id,
                  bagName: `Bag${bagIndex + 1}`,
                  productId: productId,
                  qrCode: productQrCode,
                  expiryDate: request.body.expiryDate,
                  startingDate: request.body.startingDate,
                  status: 0,
                  isExpired: 0,
              });
          });
      }
      await model.Bags.bulkCreate(bagRecords);
      if (request.body.campaignId) {
        const campaignUpdate = {};
        const totalBagCount = Number(request.body.bags || request.body.bagsNo || 0);
        const totalCouponCount = Number(request.body.coupons || request.body.couponNo || insertedCoupons.length);
        if (totalBagCount > 0) campaignUpdate.bags = totalBagCount;
        campaignUpdate.coupons = totalCouponCount;
        if (request.body.expiryDate !== undefined) campaignUpdate.expiryDate = request.body.expiryDate;
        if (request.body.startingDate !== undefined) campaignUpdate.startingDate = request.body.startingDate;
        if (Object.keys(campaignUpdate).length) {
          await model.Campaign.update(campaignUpdate, { where: { id: request.body.campaignId } });
        }
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

  module.previewCouponUpload = async function (request, response) {
    try {
      const file = request.files;
      if (!file || !file.file) {
        return response.status(400).json({ success: false, message: "No file uploaded" });
      }

      const brandId = request.body.brandId || request.query.brandId;
      if (!brandId) {
        return response.status(400).json({ success: false, message: "Brand id is required." });
      }

      const fileExtension = path.extname(file.file.name).toLowerCase();
      if (fileExtension === ".csv") {
        parseCSVFile(file, [], (error, result) => {
          if (error) {
            return response.json({ success: false, message: error.message });
          }

          const previewRows = (result.coupons || []).map((coupon) => ({
            couponCode: coupon.couponCode || "",
            title: coupon.title || "",
            description: coupon.description || "",
            couponImage: coupon.couponImage || "",
          }));

          return response.json({
            success: true,
            previewRows,
            columns: ["couponCode", "title", "description", "couponImage"],
          });
        });
        return;
      }

      if (fileExtension === ".xls" || fileExtension === ".xlsx") {
        const couponbulk = parseExcelFile(file, []);
        if (couponbulk.status === "success") {
          const previewRows = (couponbulk.coupons || []).map((coupon) => ({
            couponCode: coupon.couponCode || "",
            title: coupon.title || "",
            description: coupon.description || "",
            couponImage: coupon.couponImage || "",
          }));

          return response.json({
            success: true,
            previewRows,
            columns: ["couponCode", "title", "description", "couponImage"],
          });
        }
        return response.json({ success: false, message: couponbulk.message });
      }

      return response.status(400).json({ success: false, message: "Format is Not Valid" });
    } catch (error) {
      console.log("Error while previewing coupon upload", error);
      return response.status(500).json({ success: false, message: "Internal Server Error" });
    }
  };

  module.uploadCoupon = async function (request, response) {
    try {
      const file = request.files;
      const brandId = request.body.brandId || request.query.brandId;
      const couponStatus = String(request.body.couponStatus || request.body.status || "unused").trim() || "unused";
      if (!brandId) {
        return response
          .status(400)
          .json({ success: false, message: "Brand id is required." });
      }

      const previewData = request.body.previewData || request.body.rows || request.body.coupons;
      if (previewData) {
        let parsedRows = [];
        if (Array.isArray(previewData)) {
          parsedRows = previewData;
        } else if (typeof previewData === "string") {
          try {
            const parsedPayload = JSON.parse(previewData);
            if (Array.isArray(parsedPayload)) {
              parsedRows = parsedPayload;
            }
          } catch (error) {
            console.log("Invalid preview data payload", error);
          }
        }

        if (!parsedRows.length) {
          return response.json({ success: false, message: "No preview rows were provided." });
        }

        const expectedCount = Number(request.body.coupons || request.body.couponNo || 0);
        const existingCoupons = await model.Coupon.findAll({
          where: { brand_id: brandId },
          attributes: ["couponCode"],
          raw: true,
        });
        const existingSet = new Set(existingCoupons.map((coupon) => String(coupon.couponCode).toUpperCase()));

        const normalizedCoupons = [];
        const validationErrors = [];
        const seenCodes = new Set();

        parsedRows.forEach((row, index) => {
          const normalizedCoupon = normalizeCouponEntry(row);
          if (!normalizedCoupon || !normalizedCoupon.couponCode) {
            validationErrors.push({ row: index + 1, message: "Coupon code is required." });
            return;
          }

          const key = normalizedCoupon.couponCode.toUpperCase();
         

          seenCodes.add(key);
          normalizedCoupons.push(normalizedCoupon);
        });

        if (validationErrors.length) {
          return response.json({
            success: false,
            message: "Validation failed for the edited coupon data.",
            errors: validationErrors,
          });
        }

        if (expectedCount > 0 && normalizedCoupons.length !== expectedCount) {
          return response.json({
            success: false,
            message: `Please upload exactly ${expectedCount} coupons. Found ${normalizedCoupons.length}.`,
          });
        }

        const updatedCoupons = await Promise.all(
          normalizedCoupons.map(async (coupon) => ({
            ...coupon,
            couponImage: saveCouponImage(coupon.couponImage),
            brand_id: brandId,
            status: couponStatus,
            expiryDate: request.body.expiryDate,
            startingDate: request.body.startingDate,
          }))
        );

        const insertedCoupons = await model.Coupon.bulkCreate(updatedCoupons);
        const totalBagCount = Number(request.body.bags || request.body.bagsNo || 0);
        const bagProductIds = createBagProductIds(request.body.productId, totalBagCount);
        const bagRecords = [];
        for (let bagIndex = 0; bagIndex < totalBagCount; bagIndex++) {
          const productId = bagProductIds.length ? bagProductIds[bagIndex] : request.body.productId;
          const qrLink = `${process.env.BASE_URL}/coupon/${productId}`;
          const productQrCode = await generateProductQrPath(qrLink, productId);
          insertedCoupons.forEach((coupon) => {
            bagRecords.push({
              campaign_id: request.body.campaignId,
              brand_id: brandId,
              coupon_id: coupon.id,
              bagName: `Bag${bagIndex + 1}`,
              productId: productId,
              qrCode: productQrCode,
              expiryDate: request.body.expiryDate,
              startingDate: request.body.startingDate,
              status: false,
              isExpired: false,
            });
          });
        }
        await model.Bags.bulkCreate(bagRecords);
        if (request.body.campaignId) {
          const campaignUpdate = {};
          const totalCouponCount = Number(request.body.coupons || request.body.couponNo || insertedCoupons.length);
          if (totalBagCount > 0) campaignUpdate.bags = totalBagCount;
          campaignUpdate.coupons = totalCouponCount;
          if (request.body.expiryDate !== undefined) campaignUpdate.expiryDate = request.body.expiryDate;
          if (request.body.startingDate !== undefined) campaignUpdate.startingDate = request.body.startingDate;
          if (Object.keys(campaignUpdate).length) {
            await model.Campaign.update(campaignUpdate, { where: { id: request.body.campaignId } });
          }
        }
        return response.json({ success: true, message: `Added ${updatedCoupons.length} coupon(s).` });
      }

      if (!file) {
        return response
          .status(400)
          .json({ success: false, message: "No file uploaded" });
      }

      const fileExtension = path.extname(file.file.name).toLowerCase();
      const coupons = [];

      if (fileExtension === ".csv") {
        parseCSVFile(file, [], async (error, result) => {
          if (error) {
            return response.json({ success: false, message: error.message });
          }

          const parsedCoupons = result.coupons || [];
          const expectedCount = Number(request.body.coupons);
          if (expectedCount > 0 && parsedCoupons.length !== expectedCount) {
            return response.json({
              success: false,
              message: `Please upload exactly ${expectedCount} coupons. Found ${parsedCoupons.length}.`,
            });
          }

          const updatedCoupons = await Promise.all(
            parsedCoupons.map(async (coupon) => {
              return {
                ...coupon,
                brand_id: brandId,
                expiryDate: request.body.expiryDate,
                startingDate: request.body.startingDate,
              };
            })
          );

        const insertedCoupons = await model.Coupon.bulkCreate(updatedCoupons);
          const totalBagCount = Number(request.body.bags || request.body.bagsNo || 0);
          const bagProductIds = createBagProductIds(request.body.productId, totalBagCount);
          const bagRecords = [];
          for (let bagIndex = 0; bagIndex < totalBagCount; bagIndex++) {
            const productId = bagProductIds.length ? bagProductIds[bagIndex] : request.body.productId;
            const qrLink = `${process.env.BASE_URL}/coupon/${productId}`;
            const productQrCode = await generateProductQrPath(qrLink, productId);
            insertedCoupons.forEach((coupon) => {
              bagRecords.push({
                campaign_id: request.body.campaignId,
                brand_id: brandId,
                coupon_id: coupon.id,
                bagName: `Bag${bagIndex + 1}`,
                productId: productId,
                qrCode: productQrCode,
                expiryDate: request.body.expiryDate,
                startingDate: request.body.startingDate,
                status: false,
                isExpired: false,
              });
            });
          }
          try {
            await model.Bags.bulkCreate(bagRecords);
            if (request.body.campaignId) {
              const campaignUpdate = {};
              const totalCouponCount = Number(request.body.coupons || request.body.couponNo || insertedCoupons.length);
              if (totalBagCount > 0) campaignUpdate.bags = totalBagCount;
              campaignUpdate.coupons = totalCouponCount;
              if (request.body.expiryDate !== undefined) campaignUpdate.expiryDate = request.body.expiryDate;
              if (request.body.startingDate !== undefined) campaignUpdate.startingDate = request.body.startingDate;
              if (Object.keys(campaignUpdate).length) {
                await model.Campaign.update(campaignUpdate, { where: { id: request.body.campaignId } });
              }
            }
          } catch (bagError) {
            return response.json({ success: false, message: "Error inserting bag records." });
          }
          return response.json({ success: true });
        });
      } else if (fileExtension === ".xls" || fileExtension === ".xlsx") {
        let couponbulk = await parseExcelFile(file, coupons);

        if (couponbulk.status == "success") {
          const parsedCoupons = couponbulk.coupons || [];
          const expectedCount = Number(request.body.coupons);
          if (expectedCount > 0 && parsedCoupons.length !== expectedCount) {
            return response.json({
              success: false,
              message: `Please upload exactly ${expectedCount} coupons. Found ${parsedCoupons.length}.`,
            });
          }
          const updatedCoupons = await Promise.all(
            parsedCoupons.map(async (coupon) => {
              return {
                ...coupon,
                brand_id: brandId,
                expiryDate: request.body.expiryDate,
                startingDate: request.body.startingDate,
              };
            })
          );

        const insertedCoupons = await model.Coupon.bulkCreate(updatedCoupons);
          const totalBagCount = Number(request.body.bags || request.body.bagsNo || 0);
          const bagProductIds = createBagProductIds(request.body.productId, totalBagCount);
          const bagRecords = [];
          for (let bagIndex = 0; bagIndex < totalBagCount; bagIndex++) {
            const productId = bagProductIds.length ? bagProductIds[bagIndex] : request.body.productId;
            const qrLink = `${process.env.BASE_URL}/coupon/${productId}`;
            const productQrCode = await generateProductQrPath(qrLink, productId);
            insertedCoupons.forEach((coupon) => {
              bagRecords.push({
                campaign_id: request.body.campaignId,
                brand_id: brandId,
                coupon_id: coupon.id,
                bagName: `Bag${bagIndex + 1}`,
                productId: productId,
                qrCode: productQrCode,
                expiryDate: request.body.expiryDate,
                startingDate: request.body.startingDate,
                status: false,
                is_expired: false,
              });
            });
          }
          await model.Bags.bulkCreate(bagRecords);
          if (request.body.campaignId) {
            const campaignUpdate = {};
            const totalCouponCount = Number(request.body.coupons || request.body.couponNo || insertedCoupons.length);
            if (totalBagCount > 0) campaignUpdate.bags = totalBagCount;
            campaignUpdate.coupons = totalCouponCount;
            if (request.body.expiryDate !== undefined) campaignUpdate.expiryDate = request.body.expiryDate;
            if (request.body.startingDate !== undefined) campaignUpdate.startingDate = request.body.startingDate;
            if (Object.keys(campaignUpdate).length) {
              await model.Campaign.update(campaignUpdate, { where: { id: request.body.campaignId } });
            }
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
    couponImage: String(
      row?.couponImage || row?.["CouponImage"] || row?.["couponImage"] || ""
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
