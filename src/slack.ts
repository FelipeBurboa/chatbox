import type { Handler } from '@netlify/functions';
import { parse } from 'querystring';
import { slackApi, verifySlackRequest, blocks, modal } from './util/slack';
import { saveItems } from './util/notion';

async function handleSlashCommand(payload:SlackSlashCommandPayload){
	switch(payload.command){
		case '/bread':
			const response = await slackApi('views.open',
				modal({
					id: 'bread-modal',
					title: 'Vamos a hablar de pan',
					trigger_id: payload.trigger_id,
					blocks: [
						blocks.section({
							text: 'Tenemos que empezar por hablar de pan *AHORA*!'
						}),
						blocks.input({
							id: 'opinion',
							label: '¿Cual es tu pan favorito?',
							placeholder: 'Ejemplo: Ciabbata Italiana',
							initial_value: payload.text ?? '',
							hint: 'Ingresa tu opinion'
						}),
						blocks.select({
							id: 'good_level',
							label: '¿Cuanto te gusta el pan?',
							placeholder: 'Elige una opcion',
							options: [
								{
									label: 'high',
									value: 'high'
								},
								{
									label: 'medium',
									value: 'medium'
								},
								{
									label: 'low',
									value: 'low'
								}
							]
						})
					]
				})
			);

		if(!response.ok){
			console.log(response);
		}
		break;

		default:
			return{
				statusCode: 200,
				body: `El comando ${payload.command} no existe!`,
			}
	}

	return {
		statusCode: 200,
		body: '',
	}
}

async function handleInteractivity(payload:SlackModalPayload){
	const callback_id = payload.callback_id ?? payload.view.callback_id;

	switch(callback_id){
		case 'bread-modal':
			const data = payload.view.state.values;
			const fields = {
				opinion: data.opinion_block.opinion?.value,
				goodLevel: data.good_level_block.good_level?.selected_option?.value,
				submitter: payload.user.name,
			}

		await saveItems(fields);

		await slackApi('chat.postMessage', {
			channel: 'C0731AMTV3M',
			text: `Gracias por tu opinion :eyes: <@${payload.user.id}>!. Su opinion es que su :bread: favorito es: ${fields.opinion}. \n\n Su nivel de cuanto le gusta el pan es: ${fields.goodLevel}`,
	})

		break;

		case 'start-bread-talk':
		const channel = payload.channel?.id;
		const user_id = payload.user?.id;
		const thread_ts = payload.message.thread_ts ?? payload.message.ts;

		await slackApi('chat.postMessage', {
			channel,
			thread_ts,
			text: `Hey! <@${user_id}>:, recuerda usar nuestro bot para hablar sobre el :bread:!. El comando es \`/bread\` y funciona en el main channel`
		})

		break;

		default:
			console.log('Unhandled callback_id: ', callback_id);
			return {
				statusCode: 400,
				body: 'Unhandled callback_id: ' + callback_id,
			}


	}

	return {
		statusCode: 200,
		body: '',
	}
}

export const handler: Handler = async (event) => {
	// TODO validate the Slack request
	const valid = verifySlackRequest(event);

	if(!valid){
		console.log('Invalid Slack request');

		return {
			statusCode: 400,
			body: 'Invalid Slack request',
		}
	}

	// TODO handle slash commands
	const body = parse(event.body ?? '') as SlackPayload;
	if(body.command){
		return handleSlashCommand(body as SlackSlashCommandPayload);
	}

	// TODO handle interactivity (e.g. context commands, modals)
	if(body.payload){
		const payload = JSON.parse(body.payload);
		return handleInteractivity(payload);
	}

	return {
		statusCode: 200,
		body: 'TODO: handle Slack commands and interactivity!!',
	};
};
