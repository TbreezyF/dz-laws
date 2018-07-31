module.exports = {
    image: async(shop, db) => {
        try {
            const AWS = require('aws-sdk');

            AWS.config.update({
                region: "ca-central-1",
                endpoint: "https://lambda.ca-central-1.amazonaws.com"
            });

            let lambda = new AWS.Lambda();

            let payload = JSON.stringify({
                "shop": shop
            });

            let params = {
                FunctionName: 'dropthemizer-screenshotter',
                InvocationType: 'RequestResponse',
                Payload: payload
            };

            console.log('Fetching screenshot from lambda for ' + shop + '...');

            let data = await lambda.invoke(params).promise();

            console.log('Fetch succeeded exit (0)\n');

            let screenshot = JSON.parse(data.Payload);

            if (!data.FunctionError || data.FunctionError == '') {
                updateDBwithScreenshot(shop, screenshot, db);
            }
            return screenshot;
        } catch (error) {
            console.log('Could not generate new screenshot exit(1)');
        }
    }
}

async function updateDBwithScreenshot(shop, screenshot, db) {
    try {
        let date = new Date().getDate();
        let updateParams = {
            TableName: "Dropthemizer-Users",
            Key: {
                "shop": shop
            },
            UpdateExpression: "set info.screenshot = :s, info.screenshot_date = :d",
            ExpressionAttributeValues: {
                ":s": screenshot,
                ":d": date
            }
        };
        db.update(updateParams).promise();
    } catch (error) {
        console.log("Tried to update user screenshot data when user does not yet exist...");
    }
}