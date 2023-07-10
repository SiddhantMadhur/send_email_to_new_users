require("dotenv").config();
import * as sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API??"")


import { RealtimePostgresInsertPayload, createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL ?? "",
  process.env.SUPABASE_KEY ?? "",
  {
    auth: {
        persistSession: false
    }
  }
);


function getNumberSuffix(num)
{
    var array = ("" + num).split("").reverse(); // E.g. 123 = array("3","2","1")
    
    if (array[1] != "1") { // Number is not in the teens
        switch (array[0]) {
            case "1": return "st";
            case "2": return "nd";
            case "3": return "rd";
        }
    }
    
    return "th";
}


/**
 * 
 * @param payload RealtimePostgresInsertPayload from a Supabase subcribe event
 */
async function handleNewUser(payload) {
    console.log('Detected User')
    const {
        displayname,
        rank,
        email_address
    } = payload.new
    
    const msg = {
        to: email_address,
        from: process.env.FROM_EMAIL??"",
        dynamic_template_data: {
            "user_display_name": displayname,
            "rank": `${rank}${getNumberSuffix(rank)}`
        },
        template_id: process.env.SENDGRID_TEMPLATE_ID,
    }

   // @ts-ignore
    sgMail.send(msg)
    .then(()=>{
        console.log("Email sent to ", displayname, "{", email_address, "}")
    })


}

function subscribeToChanges() {
  console.log("Subscribing...");
  const channel = supabase
    .channel("table-db-changes")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "profiles",
      },
      (payload) => {
        handleNewUser(payload)
      }
    )
    .subscribe();
}

subscribeToChanges();
