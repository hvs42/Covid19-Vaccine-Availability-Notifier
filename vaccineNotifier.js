require('dotenv').config()
const moment = require('moment');
const cron = require('node-cron');
const axios = require('axios');
const mongoose = require("mongoose");
const notifier = require('./notifier');

const AGENT = process.env.AGENT;
const DB = process.env.DB;


mongoose.connect(DB,  { useNewUrlParser: true, useUnifiedTopology: true, 'useFindAndModify': false})
    .then((response) => {
        console.log("connection successfull");
    })
    .catch((err) => console.log(err));



    const vaccineSchema = mongoose.Schema({
        pincode : Number,
        mailID  : [
            {
                mail : String,
                dateOfReg :String
            }
        ],
        data: Array,
        notify : Boolean
    
    });

const vaccinenotifier = mongoose.model("vaccinenotifier",vaccineSchema);


async function main(){
    try {
        cron.schedule('*/5 * * * *', async () => {
         await vaccinenotifier.find({},function(err,result){
                result.forEach(function(r) {
                    checkAvailability(r.pincode);
              });
            });
             
        });
    } catch (e) {
        console.log('an error occured: ' + JSON.stringify(e, null, 2));
        throw e;
    }
}


async function checkAvailability(pincode) {

    
    const promises = [];

    let datesArray = await fetchNext5Days();
    var i = 0;
    for(i = 0; i<datesArray.length; i++) {
        var date = datesArray[i];
        promises.push(getSlotsForDate(date, pincode));
    }

    Promise.all(promises)
        .then((data) => {
            var dataArray = new Array();
            for(var p of data)
            {
                if(p)
                {
                    // console.log(p);
                    dataArray.push(p);
                }
            }

            console.log("data array :- ", dataArray);
            vaccinenotifier.findOne({pincode : pincode},function(err,result){
                // console.log(result);
                var rlen = result.data.length;
                var dlen = dataArray.length;
                var email = [];
                for(var i=0; i<result.mailID.length; i++)
                {
                    email.push(result.mailID[i].mail);
                }
                if(result.data.length === 0)
                {
                    // console.log("data array 2 :- ", dataArray);
                    result.data = dataArray;
                    result.save((error, ur) => {
                        // console.log(ur);
                        // console.log(error);
                    });

                    // notifyMe(dataArray,email, pincode);
                    console.log("newdata");
                    // console.log("email id :- ", email);
                }
                else if((rlen === dlen) && (dataArray[dlen - 1].date === result.data[rlen - 1].date))
                {
                    console.log("same");
                    
                }
                else
                {
                    result.data = dataArray;
                    result.save((error, ur) => {
                        // console.log(ur);
                    });
                    console.log("updatedata");
                    notifyMe(dataArray,email, pincode);
                }
            });
            
        })

}

function getSlotsForDate(DATE, PINCODE) {
    let config = {
        method: 'get',
        url: 'https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByPin?pincode=' + PINCODE + '&date='+ DATE,
        headers: {
            'accept': 'application/json',
            'Accept-Language': 'hi_IN',
            'User-Agent': AGENT
        }
    };

 const promise =   axios(config)
                        .then(function (slots) {
                            let sessions = slots.data.sessions;
                            let validSlots = sessions.filter(slot => slot.available_capacity > 0)
                            // console.log({date:DATE, validSlots: validSlots.length})
                            if(validSlots.length > 0) {
                                let schema = {
                                    date: DATE,
                                    validSlotsdata: validSlots
                                }
                                return schema;
                            }
                        })
                        .catch(function (error) {
                            console.log(error);
                        });

    const dataPromise = promise.then((response) => response);
    return dataPromise;
}

async function

notifyMe(validSlots,email, pincode){
    notifier.sendEmail(email,validSlots,pincode, (err, result) => {
        if(err) {
            console.error({err});
        }
    })
};

async function fetchNext5Days(){
    let dates = [];
    let today = moment();
    for(let i = 0 ; i < 5 ; i ++ ){
        let dateString = today.format('DD-MM-YYYY')
        dates.push(dateString);
        today.add(1, 'day');
    }
    return dates;
}



main()
    .then(() => {console.log('Vaccine availability checker started.');});
