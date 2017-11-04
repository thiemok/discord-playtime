/* eslint-env jest */
import generateEmbeds from 'util/embedHelpers';
import { RichEmbed } from 'discord.js';
import MockDate from 'mockdate';

beforeAll(() => {
	MockDate.set(1434319925275);
});

afterAll(() => {
	MockDate.reset();
});

const generateStringOfLength = (length) => {
	let string = '';
	for (let i = 0; i < length; i++) {
		string += 'a';
	}
	return string;
};

describe('EmbedHelpers', () => {

	test('generates defaults correctly', () => {
		const expectedEmbed = new RichEmbed()
			.setColor('DEFAULT')
			.setTimestamp()
			.setThumbnail('https://cdn.discordapp.com/embed/avatars/0.png')
			.setFooter('Powered by discord-playtime', 'https://assets-cdn.github.com/favicon.ico');

		expect.assertions(1);
		return expect(generateEmbeds({}))
			.resolves
			.toEqual([expectedEmbed]);
	});

	test('Sets author', () => {
		const sourceData = {
			author: {
				name: 'Test',
				url: 'https://discordapp.com',
				icon_url: 'https://cdn.discordapp.com/embed/avatars/0.png',
			},
		};

		const expectedEmbed = new RichEmbed()
			.setColor('DEFAULT')
			.setTimestamp()
			.setThumbnail('https://cdn.discordapp.com/embed/avatars/0.png')
			.setFooter('Powered by discord-playtime', 'https://assets-cdn.github.com/favicon.ico')
			.setAuthor('Test', 'https://cdn.discordapp.com/embed/avatars/0.png', 'https://discordapp.com');

		expect.assertions(1);
		return expect(generateEmbeds(sourceData))
			.resolves
			.toEqual([expectedEmbed]);
	});

	test('Author.name field gets truncated', () => {
		const sourceData = {
			author: {
				name: generateStringOfLength(270),
				url: 'https://discordapp.com',
				icon_url: 'https://cdn.discordapp.com/embed/avatars/0.png',
			},
		};
		const expectedEmbed = new RichEmbed()
			.setColor('DEFAULT')
			.setTimestamp()
			.setThumbnail('https://cdn.discordapp.com/embed/avatars/0.png')
			.setFooter('Powered by discord-playtime', 'https://assets-cdn.github.com/favicon.ico')
			.setAuthor(generateStringOfLength(256), 'https://cdn.discordapp.com/embed/avatars/0.png', 'https://discordapp.com');

		expect.assertions(1);
		return expect(generateEmbeds(sourceData))
			.resolves
			.toEqual([expectedEmbed]);
	});

	test('Sets color', () => {
		const sourceData = {
			color: 2,
		};

		const expectedEmbed = new RichEmbed()
			.setColor(2)
			.setTimestamp()
			.setThumbnail('https://cdn.discordapp.com/embed/avatars/0.png')
			.setFooter('Powered by discord-playtime', 'https://assets-cdn.github.com/favicon.ico');

		expect.assertions(1);
		return expect(generateEmbeds(sourceData))
			.resolves
			.toEqual([expectedEmbed]);
	});

	test('Sets thumbnail', () => {
		const sourceData = {
			thumbnail: 'https://cdn.discordapp.com/embed/avatars/1.png',
		};

		const expectedEmbed = new RichEmbed()
			.setColor('DEFAULT')
			.setTimestamp()
			.setThumbnail('https://cdn.discordapp.com/embed/avatars/1.png')
			.setFooter('Powered by discord-playtime', 'https://assets-cdn.github.com/favicon.ico');

		expect.assertions(1);
		return expect(generateEmbeds(sourceData))
			.resolves
			.toEqual([expectedEmbed]);
	});

	test('adds single Field', () => {
		const sourceData = {
			fields: [
				{ name: 'General stats', value: 'Total time played: *0min*' },
			],
		};

		const expectedEmbed = new RichEmbed()
			.setColor('DEFAULT')
			.setTimestamp()
			.setThumbnail('https://cdn.discordapp.com/embed/avatars/0.png')
			.setFooter('Powered by discord-playtime', 'https://assets-cdn.github.com/favicon.ico')
			.addField('General stats', 'Total time played: *0min*');

		expect.assertions(1);
		return expect(generateEmbeds(sourceData))
			.resolves
			.toEqual([expectedEmbed]);
	});

	test('Field.name field gets truncated', () => {
		const sourceData = {
			fields: [
				{ name: generateStringOfLength(270), value: 'Total time played: *0min*' },
			],
		};

		const expectedEmbed = new RichEmbed()
			.setColor('DEFAULT')
			.setTimestamp()
			.setThumbnail('https://cdn.discordapp.com/embed/avatars/0.png')
			.setFooter('Powered by discord-playtime', 'https://assets-cdn.github.com/favicon.ico')
			.addField(generateStringOfLength(256), 'Total time played: *0min*');

		expect.assertions(1);
		return expect(generateEmbeds(sourceData))
			.resolves
			.toEqual([expectedEmbed]);
	});

	test('Field.value.length > 1024 initiates creation of new field at closest line break', () => {
		const sourceData = {
			fields: [
				{ name: 'General stats', value: `${generateStringOfLength(1020)}\n${generateStringOfLength(200)}` },
			],
		};

		const expectedEmbed = new RichEmbed()
			.setColor('DEFAULT')
			.setTimestamp()
			.setThumbnail('https://cdn.discordapp.com/embed/avatars/0.png')
			.setFooter('Powered by discord-playtime', 'https://assets-cdn.github.com/favicon.ico')
			.addField('General stats', generateStringOfLength(1020))
			.addField('\u200B', generateStringOfLength(200));

		expect.assertions(1);
		return expect(generateEmbeds(sourceData))
			.resolves
			.toEqual([expectedEmbed]);
	});

	test('Extra fields from oversized fields respect order when the following field is inlined', () => {
		const sourceData = {
			fields: [
				{ name: 'General stats', value: `${generateStringOfLength(1020)}\n${generateStringOfLength(200)}`, inline: true },
				{ name: 'General stats 2', value: `${generateStringOfLength(1020).toUpperCase()}\n${generateStringOfLength(200).toUpperCase()}`, inline: true },
			],
		};

		const expectedEmbed = new RichEmbed()
			.setColor('DEFAULT')
			.setTimestamp()
			.setThumbnail('https://cdn.discordapp.com/embed/avatars/0.png')
			.setFooter('Powered by discord-playtime', 'https://assets-cdn.github.com/favicon.ico')
			.addField('General stats', generateStringOfLength(1020), true)
			.addField('General stats 2', generateStringOfLength(1020).toUpperCase(), true)
			.addField('\u200B', generateStringOfLength(200), true)
			.addField('\u200B', generateStringOfLength(200).toUpperCase(), true);

		expect.assertions(1);
		return expect(generateEmbeds(sourceData))
			.resolves
			.toEqual([expectedEmbed]);
	});

	test('Creation of more than 25 fields results in the generation of a second embed', () => {
		const fields = (num) => {
			const content = [];
			for (let i = 0; i < num; i++) {
				content.push({
					name: 'A',
					value: 'test',
					inline: false,
				});
			}
			return content;
		};

		const sourceData = {
			fields: fields(26),
		};

		const expectedEmbeds = [
			new RichEmbed({
				color: 57082,
				timestamp: Date(),
				thumbnail: {
					url: 'https://cdn.discordapp.com/embed/avatars/0.png',
				},
				footer: {
					icon_url: 'https://assets-cdn.github.com/favicon.ico',
					text: 'Powered by discord-playtime',
				},
				fields: fields(25),
			}),
			new RichEmbed({
				color: 57082,
				timestamp: Date(),
				thumbnail: {
					url: 'https://cdn.discordapp.com/embed/avatars/0.png',
				},
				footer: {
					icon_url: 'https://assets-cdn.github.com/favicon.ico',
					text: 'Powered by discord-playtime',
				},
				fields: fields(1),
			}),
		];

		expect.assertions(1);
		return expect(generateEmbeds(sourceData))
			.resolves
			.toEqual(expectedEmbeds);
	});

	test('Exceeding the overall characterlimit of 6000 results in the generation of a second embed', () => {
		const sourceData = {
			fields: [
				{ name: generateStringOfLength(256), value: generateStringOfLength(1024) },
				{ name: generateStringOfLength(256), value: generateStringOfLength(1024) },
				{ name: generateStringOfLength(256), value: generateStringOfLength(1024) },
				{ name: generateStringOfLength(256), value: generateStringOfLength(1024) },
				{ name: 'AA', value: generateStringOfLength(1024) },
			],
		};

		const expectedEmbeds = [
			new RichEmbed()
				.setColor('DEFAULT')
				.setTimestamp()
				.setThumbnail('https://cdn.discordapp.com/embed/avatars/0.png')
				.setFooter('Powered by discord-playtime', 'https://assets-cdn.github.com/favicon.ico')
				.addField(generateStringOfLength(256), generateStringOfLength(1024))
				.addField(generateStringOfLength(256), generateStringOfLength(1024))
				.addField(generateStringOfLength(256), generateStringOfLength(1024))
				.addField(generateStringOfLength(256), generateStringOfLength(1024)),
			new RichEmbed()
				.setColor('DEFAULT')
				.setTimestamp()
				.setThumbnail('https://cdn.discordapp.com/embed/avatars/0.png')
				.setFooter('Powered by discord-playtime', 'https://assets-cdn.github.com/favicon.ico')
				.addField('AA', generateStringOfLength(1024)),
		];

		expect.assertions(1);
		return expect(generateEmbeds(sourceData))
			.resolves
			.toEqual(expectedEmbeds);
	});
});
