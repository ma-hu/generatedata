const fs = require('fs');
const md5File = require('md5-file');
const path = require('path');

const getHashFilename = (target) => `__hash-${path.basename(target, path.extname(target))}`;

const generateWorkerHashfile = (src, folder) => {
	const hashFilename = getHashFilename(src);
	const fileHash = md5File.sync(`${folder}/${src}`);
	const fileWithPath = `${folder}/${hashFilename}`;

	if (fs.existsSync(fileWithPath)) {
		fs.unlinkSync(fileWithPath);
	}
	fs.writeFileSync(fileWithPath, fileHash);
};


/**
 * Get a new scoped filename for a web worker plugin file (Export Type, Data Type, Country).
 * @param file - the full path including filename or just the filename
 * @param workerType - "country", "dataType" or "exportType
 */
const getScopedWorkerFilename = (file, workerType) => {
	let fileWithoutExt = path.basename(file, path.extname(file));

	let prefix = '';
	if (workerType === 'dataType') {
		prefix = 'DT-';
	} else if (workerType === 'exportType') {
		prefix = 'ET-';
	} else if (workerType === 'country') {
		prefix = 'C-';
		const folder = path.dirname(file).split(path.sep);
		fileWithoutExt = folder[folder.length-1];
	}

	return `${prefix}${fileWithoutExt}.js`;
};

const hasWorkerFileChanged = (filename, hashFile) => {
	let hasChanged = true;

	if (fs.existsSync(hashFile) && fs.existsSync(filename)) {
		const hash = fs.readFileSync(hashFile, 'utf8');

		if (md5File.sync(filename) === hash) {
			hasChanged = false;
		}
	}

	return hasChanged;
};


export const findStringsInEnFileMissingFromOtherLangFiles = (results, stringsByLocale) => {
	const langs = Object.keys(stringsByLocale);

	let count = 0;
	results.lines.push('\nEnglish strings missing from other lang files:\n-------------------------------------------');
	Object.keys(stringsByLocale['en_us']).forEach((key) => {
		const missing = [];
		langs.forEach((locale) => {
			if (!stringsByLocale[locale][key]) {
				missing.push(locale);
			}
		});
		if (missing.length > 0) {
			count++;
			results.lines.push(`${key}\n   -missing from: ${missing.join(', ')}`);
		}
	});

	if (count > 0) {
		results.error = true;
		results.lines.push(`-- MISSING ${count}`);
	} else {
		results.lines.push('All good!\n');
	}

	return results;
};

module.exports = {
	getHashFilename,
	generateWorkerHashfile,
	getScopedWorkerFilename,
	hasWorkerFileChanged
};
