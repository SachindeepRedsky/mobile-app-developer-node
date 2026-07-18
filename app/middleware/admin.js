module.exports = function(model) {
    var module = {};

    module.login = function(req, res, next){
        if(req.session.admin) {
            next();
        } else {
            req.flash('error',"Please login");
            res.redirect('/backend');
        }
    };

    module.isLogin = function(req, res, next){
        if (req.session.admin) {
            console.log("Already login");
           res.redirect('/backend/dashboard');            
        } else {
        	next();
        }
    };  

    return module;
}    