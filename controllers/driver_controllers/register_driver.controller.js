const bcrypt = require('bcrypt'); // Import bcrypt module
const mail_service = require('../../utility/mail_service.util'); // Import mail service
const db_query = require('../../models/db_model'); // Import db model
const sanitize_data = require('../../utility/sanitize_data.util'); // Import sanitize data
const response_headers = require('../../utility/response_headers.util'); // Import response headers
const cloudinary = require("cloudinary").v2; // Import cloudinary module
const validate_email = require('../../utility/validate_email.util'); // Import validate email
const custom_file_check = require('../../utility/custom_file_check.util'); // Import custom file check
const gen_code = require('../../utility/verification_code_gen.util'); // Import gen code
const generate_access_token = require('../../utility/generate_access_token.util'); // Import generate access token
const delete_file = require('../../utility/delete_file.util'); // Import delete file

// Cloudinary configuration for cloud storage
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});
//----------------------------------------------

const signup = async (req, res) => {
    response_headers(res); // Response headers

    // Validate the request form body data
    if (req.body){
        let form_data = req.body; // Form data from the frontend

        // Check if the appropriate request parameters are set
        if (form_data.email && form_data.password && form_data.phone_no && form_data.name && form_data.gender && form_data.plate_number){

            // Variables to hold form data individually and remove any quotes contained in them from left to right
            // and also remove leading and trailing whitespaces
            var user_email = sanitize_data(form_data.email);
            var user_password = sanitize_data(form_data.password);
            var user_phone_no = sanitize_data(form_data.phone_no);
            var user_name = sanitize_data(form_data.name);
            var user_gender = sanitize_data(form_data.gender).toLowerCase();
            var plate_number = sanitize_data(form_data.plate_number);
            //-------------------------------------------------------------------
            
            // Validate the data inputs from the form data
            if (validate_email(user_email) === true && user_email.length <= 250){
                if (user_password.length >= 5 && user_password.length <= 10){
                    if (user_phone_no.length <= 15){
                        if (parseInt(user_phone_no) !== NaN){
                            if (plate_number.length >= 5){
                                if (user_name.length <= 360){
                                    if (user_gender === 'male' || user_gender === 'female'){
                                        let result1 = await db_query.check_student_email(user_email);

                                        if (result1.status === false){
                                            if (req.file){
                                                delete_file(req.file.originalname); // Delete file
                                            }

                                            res.statusCode = 400;
                                            res.json({ err_msg: 'An error just occured, Try again later', result: null, succ_msg: null, res_code: 400 });
                                        } else if (result1.status === true){
                                            if (result1.data.length === 0){
                                                let result2 = await db_query.check_driver_phone_no(user_phone_no);

                                                if (result2.status === false){
                                                    if (req.file){
                                                        delete_file(req.file.originalname); // Delete file
                                                    }

                                                    res.statusCode = 400;
                                                    res.json({ err_msg: 'An error just occured, Try again later', result: null, succ_msg: null, res_code: 400 });
                                                } else if (result2.status === true){
                                                    if (result2.data.length === 0){
                                                        let result3 = await db_query.get_all_driver_passwords();

                                                        if (result3.status === false){
                                                            if (req.file){
                                                                delete_file(req.file.originalname); // Delete file
                                                            }

                                                            res.statusCode = 400;
                                                            res.json({ err_msg: 'An error just occured, Try again later', result: null, succ_msg: null, res_code: 400 });
                                                        } else if (result3.status === true){
                                                            if (result3.data.length === 0){
                                                                let hashed_password = bcrypt.hashSync(user_password, 10);

                                                                if (custom_file_check(req.file) === true){
                                                                    let result4 = await db_query.create_new_driver_account(user_email, hashed_password, user_phone_no, plate_number, user_name, user_gender, 'keke', 3, 0, 'https://res.cloudinary.com/dtsj6fhcd/image/upload/v1677803279/assets_and_images/1607134320_avatar_mealik.jpg', null, 0, 0);

                                                                    if (result4.status === false){
                                                                        if (req.file){
                                                                            delete_file(req.file.originalname); // Delete file
                                                                        }

                                                                        res.statusCode = 400;
                                                                        res.json({ err_msg: 'An error just occured, Try again later', result: null, succ_msg: null, res_code: 400 });
                                                                    } else if (result4.status === true){
                                                                        let driver_id = result4.data[0];

                                                                        // Create a new folder in Cloudinary
                                                                        cloudinary.api.create_folder(`driver_accounts/${driver_id.user_id}`, async function(error, result) {
                                                                            if (error) {
                                                                                let result4x = await db_query.delete_driver_account(driver_id.user_id);

                                                                                if (result4x.status === false){
                                                                                    if (req.file){
                                                                                        delete_file(req.file.originalname); // Delete file
                                                                                    }

                                                                                    res.statusCode = 400;
                                                                                    res.json({ err_msg: 'An error just occured, Try again later', result: null, succ_msg: null, res_code: 400 });
                                                                                } else if (result4x.status === true){
                                                                                    if (req.file){
                                                                                        delete_file(req.file.originalname); // Delete file
                                                                                    }

                                                                                    res.statusCode = 400;
                                                                                    res.json({ err_msg: 'Couldn\'t create account, Try again later', result: null, succ_msg: null, res_code: 400 });
                                                                                }
                                                                            } else {
                                                                                cloudinary.api.create_folder(`driver_accounts/${driver_id.user_id}/profile_image`, async function(error, result) {
                                                                                    if (error) {
                                                                                        let result4x = await db_query.delete_driver_account(driver_id.user_id);

                                                                                        if (result4x.status === false){
                                                                                            if (req.file){
                                                                                                delete_file(req.file.originalname); // Delete file
                                                                                            }

                                                                                            res.statusCode = 400;
                                                                                            res.json({ err_msg: 'An error just occured, Try again later', result: null, succ_msg: null, res_code: 400 });
                                                                                        } else if (result4x.status === true){
                                                                                            if (req.file){
                                                                                                delete_file(req.file.originalname); // Delete file
                                                                                            }

                                                                                            res.statusCode = 400;
                                                                                            res.json({ err_msg: 'Couldn\'t create account, Try again later', result: null, succ_msg: null, res_code: 400 });
                                                                                        }
                                                                                    } else {
                                                                                        cloudinary.api.create_folder(`driver_accounts/${driver_id.user_id}/vehicle_report`, async function(error, result) {
                                                                                            if (error) {
                                                                                                let result4x = await db_query.delete_driver_account(driver_id.user_id);

                                                                                                if (result4x.status === false){
                                                                                                    if (req.file){
                                                                                                        delete_file(req.file.originalname); // Delete file
                                                                                                    }

                                                                                                    res.statusCode = 400;
                                                                                                    res.json({ err_msg: 'An error just occured, Try again later', result: null, succ_msg: null, res_code: 400 });
                                                                                                } else if (result4x.status === true){
                                                                                                    if (req.file){
                                                                                                        delete_file(req.file.originalname); // Delete file
                                                                                                    }

                                                                                                    res.statusCode = 400;
                                                                                                    res.json({ err_msg: 'Couldn\'t create account, Try again later', result: null, succ_msg: null, res_code: 400 });
                                                                                                }
                                                                                            } else {
                                                                                                function uploadFile(filename, folder_name, callback) {
                                                                                                    const options = {
                                                                                                        folder: folder_name,
                                                                                                        resource_type: 'auto'
                                                                                                    };
                                                                                                    
                                                                                                    cloudinary.uploader.upload(filename, options, (err, result) => {
                                                                                                        if (err) {
                                                                                                            callback(err);
                                                                                                        } else {
                                                                                                            callback(null, result);
                                                                                                        }
                                                                                                    });
                                                                                                }
                                                                                                
                                                                                                uploadFile(`public/${req.file.originalname}`, `driver_accounts/${driver_id.user_id}/vehicle_report`, async (err, result) => {
                                                                                                    if (err) {
                                                                                                        console.error(err);
                                                                                                    } else {
                                                                                                        let file_url = result.secure_url;

                                                                                                        if (req.file){
                                                                                                            delete_file(req.file.originalname); // Delete file
                                                                                                        }
        
                                                                                                        let result5 = await db_query.update_driver_report_url(driver_id.user_id, file_url);
        
                                                                                                        if (result5.status === false){
                                                                                                            res.statusCode = 400;
                                                                                                            res.json({ err_msg: 'An error just occured, Try again later', result: null, succ_msg: null, res_code: 400 });
                                                                                                        } else if (result5.status === true){
                                                                                                            let verification_code = gen_code(6);

                                                                                                            let verif_token = generate_access_token(driver_id.user_id, 'verification_code', 300);

                                                                                                            let result6 = await db_query.store_driver_verification_code(driver_id.user_id, verification_code, verif_token);
        
                                                                                                            if (result6.status === false){
                                                                                                                res.statusCode = 400;
                                                                                                                res.json({ err_msg: 'An error just occured, Try again later', result: null, succ_msg: null, res_code: 400 });
                                                                                                            } else if (result6.status === true){
                                                                                                                mail_service('plain_mail', user_email, 'Account Verification', `Your verification code is ${verification_code}`, verification_code, user_name); // Send mail

                                                                                                                res.statusCode = 200;
                                                                                                                res.json({ err_msg: null, result: { user_id: driver_id.user_id }, succ_msg: 'Your account has been created successfully, check your mail for the verification code to verify your account', res_code: 200 });
                                                                                                            } 
                                                                                                        }
                                                                                                    }
                                                                                                });       
                                                                                            }
                                                                                        })
                                                                                    }
                                                                                })
                                                                            }
                                                                        });
                                                                        //------------------------------------------------
                                                                    }
                                                                } else {
                                                                    if (req.file){
                                                                        delete_file(req.file.originalname); // Delete file
                                                                    }

                                                                    res.statusCode = 400;
                                                                    res.json({ err_msg: 'Please upload your vehicle report', result: null, succ_msg: null, res_code: 400 });
                                                                }
                                                            } else if (result3.data.length > 0){
                                                                let all_driver_passwords = result3.data;

                                                                let password_exist_count = 0;

                                                                all_driver_passwords.forEach(async data_value => {
                                                                    let hashed_password_from_db = data_value.driver_password;
                                                                    let password_from_request = user_password;
                                                                    let compare_passwords = bcrypt.compareSync(password_from_request, hashed_password_from_db);

                                                                    if (compare_passwords === true){
                                                                        password_exist_count += 1;
                                                                    }
                                                                });

                                                                if (password_exist_count > 0){
                                                                    if (req.file){
                                                                        delete_file(req.file.originalname); // Delete file
                                                                    }

                                                                    res.statusCode = 400;
                                                                    res.json({ err_msg: 'Use a stronger password', result: null, succ_msg: null, res_code: 400 });
                                                                } else if (password_exist_count === 0){
                                                                    let hashed_password = bcrypt.hashSync(user_password, 10);

                                                                    if (custom_file_check(req.file) === true){
                                                                        let result4 = await db_query.create_new_driver_account(user_email, hashed_password, user_phone_no, plate_number, user_name, user_gender, 'keke', 3, 0, 'https://res.cloudinary.com/dtsj6fhcd/image/upload/v1677803279/assets_and_images/1607134320_avatar_mealik.jpg', null, 0, 0);

                                                                        if (result4.status === false){
                                                                            if (req.file){
                                                                                delete_file(req.file.originalname); // Delete file
                                                                            }

                                                                            res.statusCode = 400;
                                                                            res.json({ err_msg: 'An error just occured, Try again later', result: null, succ_msg: null, res_code: 400 });
                                                                        } else if (result4.status === true){
                                                                            let driver_id = result4.data[0];

                                                                            // Create a new folder in Cloudinary
                                                                            cloudinary.api.create_folder(`driver_accounts/${driver_id.user_id}`, async function(error, result) {
                                                                                if (error) {
                                                                                    let result4x = await db_query.delete_driver_account(student_id.user_id);

                                                                                    if (result4x.status === false){
                                                                                        if (req.file){
                                                                                            delete_file(req.file.originalname); // Delete file
                                                                                        }

                                                                                        res.statusCode = 400;
                                                                                        res.json({ err_msg: 'An error just occured, Try again later', result: null, succ_msg: null, res_code: 400 });
                                                                                    } else if (result4x.status === true){
                                                                                        if (req.file){
                                                                                            delete_file(req.file.originalname); // Delete file
                                                                                        }

                                                                                        res.statusCode = 400;
                                                                                        res.json({ err_msg: 'Couldn\'t create account, Try again later', result: null, succ_msg: null, res_code: 400 });
                                                                                    }
                                                                                } else {
                                                                                    cloudinary.api.create_folder(`driver_accounts/${driver_id.user_id}/profile_image`, async function(error, result) {
                                                                                        if (error) {
                                                                                            let result4x = await db_query.delete_driver_account(student_id.user_id);

                                                                                            if (result4x.status === false){
                                                                                                if (req.file){
                                                                                                    delete_file(req.file.originalname); // Delete file
                                                                                                }

                                                                                                res.statusCode = 400;
                                                                                                res.json({ err_msg: 'An error just occured, Try again later', result: null, succ_msg: null, res_code: 400 });
                                                                                            } else if (result4x.status === true){
                                                                                                if (req.file){
                                                                                                    delete_file(req.file.originalname); // Delete file
                                                                                                }

                                                                                                res.statusCode = 400;
                                                                                                res.json({ err_msg: 'Couldn\'t create account, Try again later', result: null, succ_msg: null, res_code: 400 });
                                                                                            }
                                                                                        } else {
                                                                                            cloudinary.api.create_folder(`driver_accounts/${driver_id.user_id}/vehicle_report`, async function(error, result) {
                                                                                                if (error) {
                                                                                                    let result4x = await db_query.delete_driver_account(driver_id.user_id);

                                                                                                    if (result4x.status === false){
                                                                                                        if (req.file){
                                                                                                            delete_file(req.file.originalname); // Delete file
                                                                                                        }

                                                                                                        res.statusCode = 400;
                                                                                                        res.json({ err_msg: 'An error just occured, Try again later', result: null, succ_msg: null, res_code: 400 });
                                                                                                    } else if (result4x.status === true){
                                                                                                        if (req.file){
                                                                                                            delete_file(req.file.originalname); // Delete file
                                                                                                        }

                                                                                                        res.statusCode = 400;
                                                                                                        res.json({ err_msg: 'Couldn\'t create account, Try again later', result: null, succ_msg: null, res_code: 400 });
                                                                                                    }
                                                                                                } else {
                                                                                                    function uploadFile(filename, folder_name, callback) {
                                                                                                        const options = {
                                                                                                            folder: folder_name,
                                                                                                            resource_type: 'auto'
                                                                                                        };
                                                                                                        
                                                                                                        cloudinary.uploader.upload(filename, options, (err, result) => {
                                                                                                            if (err) {
                                                                                                                callback(err);
                                                                                                            } else {
                                                                                                                callback(null, result);
                                                                                                            }
                                                                                                        });
                                                                                                    }
                                                                                                    
                                                                                                    uploadFile(`public/${req.file.originalname}`, `driver_accounts/${driver_id.user_id}/vehicle_report`, async (err, result) => {
                                                                                                        if (err) {
                                                                                                            console.error(err);
                                                                                                        } else {
                                                                                                            let file_url = result.secure_url;
            
                                                                                                            if (req.file){
                                                                                                                delete_file(req.file.originalname); // Delete file
                                                                                                            }
            
                                                                                                            let result5 = await db_query.update_driver_report_url(driver_id.user_id, file_url);
            
                                                                                                            if (result5.status === false){
                                                                                                                if (req.file){
                                                                                                                    delete_file(req.file.originalname); // Delete file
                                                                                                                }

                                                                                                                res.statusCode = 400;
                                                                                                                res.json({ err_msg: 'An error just occured, Try again later', result: null, succ_msg: null, res_code: 400 });
                                                                                                            } else if (result5.status === true){
                                                                                                                let verification_code = gen_code(6);

                                                                                                                let verif_token = generate_access_token(driver_id.user_id, 'verification_code', 300);

                                                                                                                let result6 = await db_query.store_driver_verification_code(driver_id.user_id, verification_code, verif_token);
            
                                                                                                                if (result6.status === false){
                                                                                                                    if (req.file){
                                                                                                                        delete_file(req.file.originalname); // Delete file
                                                                                                                    }

                                                                                                                    res.statusCode = 400;
                                                                                                                    res.json({ err_msg: 'An error just occured, Try again later', result: null, succ_msg: null, res_code: 400 });
                                                                                                                } else if (result6.status === true){
                                                                                                                    mail_service('plain_mail', user_email, 'Account Verification', `Your verification code is ${verification_code}`, verification_code, user_name); // Send mail

                                                                                                                    res.statusCode = 200;
                                                                                                                    res.json({ err_msg: null, result: { user_id: driver_id.user_id }, succ_msg: 'Your account has been created successfully, check your mail for the verification code to verify your account', res_code: 200 });
                                                                                                                } 
                                                                                                            }
                                                                                                        }
                                                                                                    });       
                                                                                                }
                                                                                            })
                                                                                        }
                                                                                    })
                                                                                }
                                                                            });
                                                                            //------------------------------------------------
                                                                        }
                                                                    } else {
                                                                        if (req.file){
                                                                            delete_file(req.file.originalname); // Delete file
                                                                        }

                                                                        res.statusCode = 400;
                                                                        res.json({ err_msg: 'Please upload your vehicle report', result: null, succ_msg: null, res_code: 400 });
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    } else {
                                                        if (req.file){
                                                            delete_file(req.file.originalname); // Delete file
                                                        }

                                                        res.statusCode = 400;
                                                        res.json({ err_msg: 'Error, this phone number is already in use', result: null, succ_msg: null, res_code: 400 });
                                                    }
                                                } 
                                            } else if (result1.data.length > 0){
                                                if (req.file){
                                                    delete_file(req.file.originalname); // Delete file
                                                }

                                                res.statusCode = 400;
                                                res.json({ err_msg: 'Error, this email is already in use', result: null, succ_msg: null, res_code: 400 });
                                            }
                                        }
                                    } else {
                                        if (req.file){
                                            delete_file(req.file.originalname); // Delete file
                                        }

                                        res.statusCode = 400;
                                        res.json({ err_msg: 'Error, gender can only be male or female', result: null, succ_msg: null, res_code: 400 });
                                    }
                                } else {
                                    if (req.file){
                                        delete_file(req.file.originalname); // Delete file
                                    }

                                    res.statusCode = 400;
                                    res.json({ err_msg: 'Error, name is longer than 360 characters', result: null, succ_msg: null, res_code: 400 });
                                }
                            } else {
                                if (req.file){
                                    delete_file(req.file.originalname); // Delete file
                                }

                                res.statusCode = 400;
                                res.json({ err_msg: 'Invalid plate number', result: null, succ_msg: null, res_code: 400 });
                            }
                        } else {
                            if (req.file){
                                delete_file(req.file.originalname); // Delete file
                            }

                            res.statusCode = 400;
                            res.json({ err_msg: 'Invalid phone number', result: null, succ_msg: null, res_code: 400 });
                        }
                    } else {
                        if (req.file){
                            delete_file(req.file.originalname); // Delete file
                        }

                        res.statusCode = 400;
                        res.json({ err_msg: 'Error, Phone number is longer than 15 characters', result: null, succ_msg: null, res_code: 400 });
                    }
                } else {
                    if (req.file){
                        delete_file(req.file.originalname); // Delete file
                    }

                    res.statusCode = 400;
                    res.json({ err_msg: 'Error, password can only be between 5 and 10 characters', result: null, succ_msg: null, res_code: 400 });
                }
            } else {
                if (req.file){
                    delete_file(req.file.originalname); // Delete file
                }

                res.statusCode = 400;
                res.json({ err_msg: 'Invalid email', result: null, succ_msg: null, res_code: 400 });
            }
            //-------------------------------------------------------------------
        } else {
            if (req.file){
                delete_file(req.file.originalname); // Delete file
            }

            res.statusCode = 400;
            res.json({ err_msg: 'Invalid credentials', result: null, succ_msg: null, res_code: 400 });
        }
        //--------------------------------------------------------------
    } else {
        res.statusCode = 400;
        res.json({ err_msg: 'Invalid credentials', result: null, succ_msg: null, res_code: 400 });
    }
    //--------------------------------------------
}

module.exports = signup;