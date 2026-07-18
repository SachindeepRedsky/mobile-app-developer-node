module.exports = function(model) {
	var module = {};

	module.login = async function(req, res, next){		
		console.log('artist login validation', req.body );

		req.checkBody('email', 'email is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
		}

		req.checkBody('password', 'Password is required').notEmpty().isLength({ min:6, max:10 }).withMessage('Password must be at least 6 to 10 chars long');
		var errors1 = req.validationErrors();
		if(errors1){
			return res.send({ status: 'fail', message:errors1[0].msg, data:{} });
		}	
		
		req.checkBody('device_token', 'Device token is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
		}

	 	req.checkBody('device_type', 'Device type is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
		}

		next();
 	};
	
	module.forgotPassword = async function(req, res, next){		
		console.log('artist forgotPassword validation', req.body );

		req.checkBody('email_id', 'email id is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
		}

		next();
	};
	 
	module.resetPassword = async function(req, res, next){		
		console.log('listner resetPassword validation', req.body );

		req.checkBody('password_token', 'password token is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
		}

		req.checkBody('new_password', 'New password is required').notEmpty().isLength({ min: 6, max:10 }).withMessage('New password must be at least 6 to 10 chars long');
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{}});
		}
		
		req.checkBody('confirm_new_password','Confirm password is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{}});
		}
		
		var errors = [{msg:"Password and confirm password not match. please try again"}];
		if(req.body.new_password != req.body.confirm_new_password){
			return res.send({ status: 'fail', message:errors[0].msg, data:{}});
		}

		next();
	};
	
	module.register = async function(req, res, next){
		console.log('artist register validation' );
		req.checkBody('firstname', 'firstname is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}
        
        req.checkBody('lastname', 'lastname is required').notEmpty();
        var errors = req.validationErrors();
        if(errors){
            return res.send({ status: 'fail', message:errors[0].msg, data:{} });
        }

        req.checkBody('email', 'Email address is required').notEmpty().isEmail().withMessage('Please enter valid email-id');
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
        }
           
        req.checkBody('artistname', 'artistname is required').notEmpty();
        var errors = req.validationErrors();
        if(errors){
            return res.send({ status: 'fail', message:errors[0].msg, data:{} });
        }

		req.checkBody('password', 'password is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
        }

        /* req.checkBody('birthdate', 'birthdate is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	} */

        req.checkBody('device_token', 'Device token is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}

		req.checkBody('device_type', 'Device type is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}
	   	next();
    };
    
    module.changePasswordOTPRequest = function(req, res, next){
		req.checkBody('user_id', 'Login user id is required').notEmpty();
		var errors = req.validationErrors();
	   	if(errors){
	   		return res.send({ status: 'fail', message:errors[0].msg, data:{}});
		}

		req.checkBody('current_email', 'current email id is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
        }
        
	    next();
    };
    
    module.changePasswordOTPVerify = function(req, res, next){
		req.checkBody('user_id', 'Login user id is required').notEmpty();
		var errors = req.validationErrors();
	   	if(errors){
	   		return res.send({ status: 'fail', message:errors[0].msg, data:{}});
		}

		req.checkBody('password_otp', 'password otp is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
        }
        
	    next();
	};

	module.changePassword = function(req, res, next){
		req.checkBody('user_id', 'Login user id is required').notEmpty();
		var errors = req.validationErrors();
	   	if(errors){
	   		return res.send({ status: 'fail', message:errors[0].msg, data:{}});
		}

        req.checkBody('password_otp', 'password otp is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
        }

		if(req.body.old_password){
			req.checkBody('old_password', 'old password is required').notEmpty();
			var errors = req.validationErrors();
		   	if(errors){
		   		return res.send({ status: 'fail', message:errors[0].msg, data:{}});
		   	}

		   	req.checkBody('new_password', 'New password is required').notEmpty().isLength({ min: 6, max:10 }).withMessage('New password must be at least 6 to 10 chars long');
			var errors = req.validationErrors();
		   	if(errors){
		   		return res.send({ status: 'fail', message:errors[0].msg, data:{}});
		   	}
		   	
			req.checkBody('confirm_new_password','Confirm password is required').notEmpty();
			var errors = req.validationErrors();
		   	if(errors){
		   		return res.send({ status: 'fail', message:errors[0].msg, data:{}});
		   	}
		   	
		   	var errors = [{msg:"Password and confirm password not match. please try again"}];
			if(req.body.new_password != req.body.confirm_new_password){
		   		return res.send({ status: 'fail', message:errors[0].msg, data:{}});
		   	}
		}
	    next();
	};

    module.addAlbum = async function(req, res, next){
		console.log('artist addAlbum validation' );
		req.checkBody('user_id', 'User Id is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}
        
        req.checkBody('music_type', 'Music Type is required').notEmpty();
        var errors = req.validationErrors();
        if(errors){
            return res.send({ status: 'fail', message:errors[0].msg, data:{} });
        }

        req.checkBody('record_lable', 'Record Lable is required').notEmpty();
        var errors = req.validationErrors();
        if(errors){
            return res.send({ status: 'fail', message:errors[0].msg, data:{} });
        }

		req.checkBody('copyright_holder_name', 'Copyright Holder Name is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
        }

        req.checkBody('copyright_year', 'Copyright Year is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}

        req.checkBody('realese_date', 'Realese Date is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
		}
		
		req.checkBody('song_name', 'Song Name is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
		}
		
		req.checkBody('explisit_lyrics', 'Explisit Lyrics is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
		}   

		// req.checkBody('lyrics', 'Lyrics is required').notEmpty();
		// var errors = req.validationErrors();
		// if(errors){
		// 	return res.send({ status: 'fail', message:errors[0].msg, data:{} });
		// } 

		req.checkBody('radio_edit', 'Radio Edit is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
		} 

		req.checkBody('primary_genere', 'Primary Genere is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
		} 

		req.checkBody('secondary_genere', 'Secondary Genere is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
		} 

		req.checkBody('song_language', 'Song Language is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
		} 

		req.checkBody('other_artist_approval', 'Other Artist Approval is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
		}

		next();
	};
	
	module.getAlbums = async function(req, res, next){
		console.log('artist getAlbums validation' );
		req.checkBody('user_id', 'User Id is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}
        
        next();
	};

	module.getSingleTracks = async function(req, res, next){
		console.log('artist getSingleTracks validation' );
		req.checkBody('user_id', 'User Id is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}
        
        next();
	};
	
	module.albumDetail = async function(req, res, next){
		console.log('artist albumDetail validation' );
		req.checkBody('user_id', 'User Id is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
		}
		
		req.checkBody('album_id', 'Album Id is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}
        
        next();
	};

	module.editAlbum = async function(req, res, next){
		console.log('artist editAlbum validation' );
		req.checkBody('user_id', 'User Id is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
		}
		
		req.checkBody('album_id', 'Album Id is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}
        
        next();
	};

	module.deleteAlbum = async function(req, res, next){
		console.log('artist deleteAlbum validation' );
		req.checkBody('user_id', 'User Id is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
		}
		
		req.checkBody('album_id', 'Album Id is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}
        
        next();
	};

	module.addSong = async function(req, res, next){
		console.log('artist addSong validation' );
		req.checkBody('user_id', 'User Id is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
		}
		
		req.checkBody('album_id', 'Album Id is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}
		
		req.checkBody('song_name', 'Song Name is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
		}

		req.checkBody('explisit_lyrics', 'Explisit Lyrics is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
		}
		   
		/* req.checkBody('lyrics', 'Lyrics is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
		} */

		req.checkBody('radio_edit', 'Radio Edit is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
		}
		   
		req.checkBody('primary_genere', 'Primary Genere is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}
		
		req.checkBody('secondary_genere', 'Secondary Genere is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
		}

		req.checkBody('song_language', 'Song Language is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
		}

        next();
	};

	module.editSong = async function(req, res, next){
		console.log('artist editSong validation' );
		req.checkBody('user_id', 'User Id is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
		}
		
		req.checkBody('song_id', 'Song Id is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}
        
        next();
	};

	module.deleteSong = async function(req, res, next){
		console.log('artist deleteSong validation' );
		req.checkBody('user_id', 'User Id is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
		}
		
		req.checkBody('song_id', 'Song Id is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}
        
        next();
	};

	module.getSubCategoryByCategory = async function(req, res, next){
		console.log('artist getSubCategoryByCategory validation' );
		req.checkBody('user_id', 'User Id is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
		}
		
		req.checkBody('category_id', 'Category Id is required').notEmpty();
		var errors = req.validationErrors();
		if(errors){
			return res.send({ status: 'fail', message:errors[0].msg, data:{} });
	   	}
        
        next();
	};
    
	return module;
}
