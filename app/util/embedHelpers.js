// @flow
import { RichEmbed, type ColorResolvable } from 'discord.js';
import { splitAtLineBreakPoint } from 'util/stringHelpers';

/**
 * Defaults
 */
const DEFAULT_COLOR = 'DEFAULT';
const DERFAULT_THUMBNAIL = 'https://cdn.discordapp.com/embed/avatars/0.png';
const DEFAULT_FOOTER = {
	icon_url: 'https://assets-cdn.github.com/favicon.ico',
	text: 'Powered by discord-playtime',
};

/**
 * Limits
 * SEE: https://discordapp.com/developers/docs/resources/channel#embed-limits
 */
const AUTHOR_NAME_LIMIT = 256;
const FIELDS_LIMIT = 25;
const FIELD_NAME_LIMIT = 256;
const FIELD_VALUE_LIMIT = 1025;
const CONTENT_LIMIT = 6000 - DEFAULT_FOOTER.text.length;

/**
 * Content shape of an embed field
 */
export type EmbedField = {
	name: string,
	value: string,
	inline?: boolean,
};

/**
 * Object shape of content used to generate embeds
 */
export type EmbedMessageContent = {
	color?: ColorResolvable,
	thumbnail?: string,
	author?: {
		name: string,
		url?: string,
		icon_url?: string,
	},
	fields?: Array<EmbedField>,
};

/**
 * Builds a default embed structure
 * and applies eventual overrides from the given content
 * @param   {EmbedMessageContent}  content  The desired content of the embed(s)
 * @return  {RichEmbed}                  The generated embed
 */
const buildDefaultEmbed = (content: EmbedMessageContent): RichEmbed => {
	return new RichEmbed()
		.setColor(content.color || DEFAULT_COLOR)
		.setTimestamp()
		.setThumbnail(content.thumbnail || DERFAULT_THUMBNAIL)
		.setFooter(DEFAULT_FOOTER.text, DEFAULT_FOOTER.icon_url);
};

/**
 * Adds the given fields to the embed
 * If the given embed cant hold all fields a copys of it are used
 * to add the remaining fields
 * @param  {[EmbedField]} fields The fields to add to the emebd
 * @param  {RichEmbed}    embed  The embed to add the fields to
 * @return {[RichEmbed]}         Array containing the embeds with fields appended
 */
const addFieldsToEmbed = (fields: Array<EmbedField>, embed: RichEmbed): Array<RichEmbed> => {
	const embeds: Array<RichEmbed> = [];
	const remainingFields = Array.from(fields).reverse();

	let currentEmbed = new RichEmbed(Object.assign({}, (embed: Object)));
	currentEmbed.fields = [];

	let currentContentLength = currentEmbed.author ? currentEmbed.author.name.length : 0;
	let field: EmbedField;
	while (remainingFields.length !== 0) {
		field = remainingFields.pop();

		// Truncate field.name if needed
		if (field.name.length >= FIELD_NAME_LIMIT) {
			field.name = field.name.substring(0, FIELD_NAME_LIMIT);
		}

		// Split field if field.value exceeds FIELD_VALUE_LIMIT
		if (field.value.length >= FIELD_VALUE_LIMIT) {
			const splittedValues = splitAtLineBreakPoint(field.value, FIELD_VALUE_LIMIT);
			const inlined = field.inline && remainingFields[remainingFields.length - 1].inline;
			let nextField;

			if (inlined) {
				nextField = remainingFields.pop();
			}

			remainingFields.push({
				name: '\u200B',
				value: splittedValues[1],
				inline: field.inline,
			});

			if (inlined && nextField) {
				remainingFields.push(nextField);
			}

			field.value = splittedValues[0];
		}

		// Check for max fields and max embed length
		if (
			(currentContentLength + field.name.length + field.value.length) >= CONTENT_LIMIT
			|| currentEmbed.fields.length >= FIELDS_LIMIT
		) {
			embeds.push(currentEmbed);
			currentEmbed = new RichEmbed(Object.assign({}, (embed: Object)));
			currentEmbed.fields = [];
			currentContentLength = currentEmbed.author ? currentEmbed.author.name.length : 0;
		}

		currentContentLength += (field.name.length + field.value.length);
		currentEmbed.addField(field.name, field.value, field.inline);
	}
	embeds.push(currentEmbed);

	return embeds;
};

/**
 * Generates one or if needed more embeds based on the given content.
 * @param   {EmbedMessageContent}  content  The desired content of the embed(s)
 * @return  {Promise<[RichEmbed]>}                Array containing the generated embed(s)
 */
const generateEmbeds = (content: EmbedMessageContent): Promise<Array<RichEmbed>> => {
	const pEmbed = new Promise((resolve, reject) => {
		const embed = buildDefaultEmbed(content);

		if (content.author) {
			const { author } = content;
			embed.setAuthor(
				author.name.substring(0, AUTHOR_NAME_LIMIT),
				author.icon_url,
				author.url
			);
		}

		if (content.fields) {
			const { fields } = content;
			resolve(addFieldsToEmbed(fields, embed));
		}
		resolve([embed]);
	});
	return pEmbed;
};

export default generateEmbeds;
