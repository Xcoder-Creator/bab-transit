const db_query = require('../../models/db_model'); // Import db model
const response_headers = require('../../utility/response_headers.util'); // Import response headers
const validate_auth_header = require('../../utility/validate_auth_header.util'); // Import validate auth header
const jwt = require('jsonwebtoken'); // Import jwt module
const Cryptr = require('cryptr'); // Import cryptr module
const cryptr = new Cryptr(process.env.PASSWORD_ENCRYPT_DECRYPT_KEY, { pbkdf2Iterations: 10000, saltLength: 10 }); // Get encryption/descryption key for cryptr module

const cancel_ride = async (req, res) => {
    response_headers(res); // Response headers

    // Validate the request form body data
    if (req.body){
        let form_data = req.body; // Form data from the frontend

        // Check if the appropriate request parameters are set
        if (form_data.transport_ride_id){

            // Variables to hold form data individually and remove any quotes contained in them from left to right
            // and also remove leading and trailing whitespaces
            var transport_ride_id = parseInt(form_data.transport_ride_id);
            //-------------------------------------------------------------------
            
            let auth_token = validate_auth_header(req.headers['authorization']); // Validate the authorization header

            if (auth_token == null){
                res.statusCode = 400;
                res.json({ err_msg: 'Invalid credentials', result: null, succ_msg: null, res_code: 400 });
            } else {
                let decrypted_auth_token;
                let check = true;

                try {
                    decrypted_auth_token = cryptr.decrypt(auth_token);
                } catch (error) {
                    check = false;
                }

                if (check === true){
                    jwt.verify(decrypted_auth_token, process.env.AUTH_TOKEN_SECRET, async (err, user) => {
                        if (err){
                            res.statusCode = 400;
                            res.json({ err_msg: 'Invalid credentials', result: null, succ_msg: null, res_code: 400 });
                        } else {
                            let student_id = user.user_id;

                            let result1 = await db_query.check_if_ride_exists2(transport_ride_id, student_id);
            
                            if (result1.status === false){
                                res.statusCode = 400;
                                res.json({ err_msg: 'An error just occured, Try again later', result: null, succ_msg: null, res_code: 400 });
                            } else if (result1.status === true){
                                if (result1.data.length > 0 && result1.data.length === 1){
                                    let driver_id = result1.data[0].driver_for_ride;
                                    
                                    let result2 = await db_query.check_if_ride_has_not_started_or_has_started(transport_ride_id);
        
                                    if (result2.status === false){
                                        res.statusCode = 400;
                                        res.json({ err_msg: 'An error just occured, Try again later', result: null, succ_msg: null, res_code: 400 });
                                    } else if (result2.status === true){
                                        if (result2.data.length > 0 && result2.data.length === 1){
                                            let result3 = await db_query.update_status_of_ride(transport_ride_id, 3, 0, 1, 4, 3);
        
                                            if (result3.status === false){
                                                res.statusCode = 400;
                                                res.json({ err_msg: 'An error just occured, Try again later', result: null, succ_msg: null, res_code: 400 });
                                            } else if (result3.status === true){
                                                let result4 = await db_query.get_all_driver_details(driver_id);

                                                if (result4.status === false){
                                                    res.statusCode = 400;
                                                    res.json({ err_msg: 'An error just occured, Try again later', result: null, succ_msg: null, res_code: 400 });
                                                } else if (result4.status === true){
                                                    let capacity = result4.data[0].capacity;

                                                    if (capacity < 3){
                                                        let updated_capacity = capacity + 1;

                                                        let result5 = await db_query.increase_capacity(driver_id, updated_capacity);

                                                        if (result5.status === false){
                                                            res.statusCode = 400;
                                                            res.json({ err_msg: 'An error just occured, Try again later3', result: null, succ_msg: null, res_code: 400 });
                                                        } else if (result5.status === true){
                                                            res.statusCode = 200;
                                                            res.json({ err_msg: null, result: null, succ_msg: 'This ride has been canceled successfully', res_code: 200 });   
                                                        }
                                                    } else {
                                                        res.statusCode = 200;
                                                        res.json({ err_msg: null, result: null, succ_msg: 'This ride has been canceled successfully', res_code: 200 });   
                                                    }
                                                }
                                            }
                                        } else {
                                            res.statusCode = 400;
                                            res.json({ err_msg: 'This ride cannot be canceled either because it has already been canceled or it has been ended by the driver', result: null, succ_msg: null, res_code: 400 });
                                        }
                                    }
                                } else {
                                    res.statusCode = 404;
                                    res.json({ err_msg: 'This ride does not exist', result: null, succ_msg: null, res_code: 404 });
                                }
                            }
                        }
                    });
                } else {
                    res.statusCode = 400;
                    res.json({ err_msg: 'Invalid credentials', result: null, succ_msg: null, res_code: 400 });
                }
            }
        } else {
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

module.exports = cancel_ride;