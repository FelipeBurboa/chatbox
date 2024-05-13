import { type Handler,schedule } from "@netlify/functions";
import { getNewItems } from "./util/notion";
import {  blocks, slackApi } from "./util/slack";
import { channel } from "diagnostics_channel";

const postNewNotionItemsToSlack:Handler = async () => {
    const items = await getNewItems();

    await slackApi('chat.postMessage',{
        channel:'C0731AMTV3M',
        blocks:[
            blocks.section({
                text:[
                    'Aqui estan las opiniones nuevas:',
                    '',
                    ...items.map(item => 
                        `- ${item.opinion} (Que tanto te gusta el pan: ${item.goodLevel})`,
                    ),
                    '',
                    `Ve todos los items: <https://notion.com/${process.env.NOTION_DATABASE_ID}|en Notion>.`,
                    ].join('\n'),
            })
        ]
    })

    return {
        statusCode: 200,
    }
}

//export const handler = schedule('0 9 * * 1', postNewNotionItemsToSlack)
export const handler = schedule('* * * * *', postNewNotionItemsToSlack)