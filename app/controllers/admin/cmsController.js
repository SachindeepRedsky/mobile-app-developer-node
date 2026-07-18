const { raw } = require("mysql");

module.exports = function (model) {

    var module = {};

    module.cmsPages = async function (request, response) {
        try {
            // console.log("cmsController get user page", req.session.details);
            response.render('backend/cms/cms', {
                title: 'CMS Managment',
                error: request.flash("error"),
                success: request.flash("success"),
                vErrors: request.flash("vErrors"),
                user: request.session.admin,
                alias: 'cms',
                cms: "active"
            });

        } catch (e) {
            console.log("cmsController users Error", e);
            return new Error('cmsController users Error', e);
        }
    };
    module.getCmsPage = async function (req, res) {
        try {
            // console.log("-----", req.query);
            let start = parseInt(req.query.start);
            let length = parseInt(req.query.length);
            let query = {}

            // if (search != '') {
            //   // if (status == "") {
            //   //   query = { title: { $regex: '.*' + search + '.*' }, isDeleted: false };
            //   // }
            //   // else {
            //     query = { title: { $regex: '.*' + search + '.*' },isDeleted: false };
            //   // }
            // }

            let cmsCount = await model.Cms.count(query);
            // console.log("count---", cmsCount);
            let cms = await model.Cms.findAll(query, length, start, { raw: true });
            // console.log("cms---", cms);

            var obj = {
                'draw': req.query.draw,
                'recordsTotal': cmsCount,
                'recordsFiltered': cmsCount,
                'data': cms
            };
            return res.send(obj);
        } catch (e) {
            console.log("cmsController getCmsPage Error", e);
            return new Error('cmsController getCmsPage Error', e);
        }
    };

    module.editCms = async function (request, response) {
        try {
            // console.log("editCms get addCms page", request.params.id);
            let cmsPage = await model.Cms.findOne({ where: { id: request.params.id } });
            // console.log("cmsPage --->", cmsPage);

            response.render('backend/cms/editCms', {
                title: 'CMS Managment',
                error: request.flash("error"),
                success: request.flash("success"),
                vErrors: request.flash("vErrors"),
                user: request.session.admin,
                alias: 'cms',
                cmsPage: cmsPage,
                cms: "active"
            });
        } catch (e) {
            console.log("cmsController editCms Error", e);
            return new Error('cmsController editCms Error', e);
        }
    };

    module.editCmsPost = async function (req, res) {
        try {
            // console.log("editCmsPost data ---- >", req.body,req.params);

            if (!req.body.description) {
                req.flash('error', 'Please Enter a Description');
                return res.redirect('/backend/cmsPages');
            }
            if (!req.body.title) {
                req.flash('error', 'Please Enter a Title');
                return res.redirect('/backend/cmsPages');
            }

            let updateData = { title: req.body.title, description: req.body.description };

            let cmsPage = await model.Cms.findOne({ where: { id: req.params.id } })
            if (cmsPage) {
                await model.Cms.update(updateData, { where: { id: req.params.id } })

                req.flash('success', 'Your content updated successfully.');
                return res.redirect('/backend/cmsPages');
            } else {
                req.flash('error', 'Your content is not found!');
                return res.redirect('/backend/cmsPages');
            }

        } catch (e) {
            console.log("cmsController editCmsPost Error", e);
            return new Error('cmsController editCmsPost Error', e);
        }
    };
    return module;
}