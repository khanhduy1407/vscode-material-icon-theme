import * as path from 'path';
import * as fs from 'fs';
import { fileIcons, folderIcons, languageIcons } from './../../src/icons';
import { similarity } from '../helpers/similarity';
import * as painter from '../helpers/painter';
import { FileIcon } from '../../src/models/index';

/**
 * Defines the folder where all icon files are located.
 */
const folderPath = path.join('icons');

/**
 * Defines an array with all icons that can be found in the file system.
 */
const availableIcons: { [s: string]: string } = {};

/**
 * Save the misconfigured icons.
 */
const wrongIconNames = { fileIcons: [], folderIcons: [], languageIcons: [] };

/**
 * Get all icon file names from the file system.
 */
const fsReadAllIconFiles = (err: Error, files: string[]) => {
    if (err) {
        throw Error(err.message);
    }

    files.forEach(file => {
        const fileName = file;
        const iconName = path.parse(file).name;
        availableIcons[iconName] = fileName;
    });

    // check icon configurations
    checkFileIcons();
    checkFolderIcons();
    checkLanguageIcons();

    // show error messages
    printErrors();
};

// read from the file system
fs.readdir(folderPath, fsReadAllIconFiles);

/**
 * Check if the file icons from the configuration are available on the file system.
 */
const checkFileIcons = () => {
    fileIcons.icons.concat([fileIcons.defaultIcon]).forEach(icon => {
        if (!availableIcons[icon.name]) {
            wrongIconNames.fileIcons.push(icon.name);
        }
        checkLightVersion(icon);
        checkHighContrastVersion(icon);
    });
};

/**
 * Check if the icon has a light version.
 */
const checkLightVersion = (icon: FileIcon) => {
    if (icon.light === true) {
        const lightVersion = `${icon.name}_light`;
        if (!availableIcons[lightVersion]) {
            wrongIconNames.fileIcons.push(lightVersion);
        }
    }
};

/**
 * Check if the icon has a high contrasts version.
 */
const checkHighContrastVersion = (icon: FileIcon) => {
    if (icon.highContrast === true) {
        const highContrastVersion = `${icon.name}_highContrast`;
        if (!availableIcons[highContrastVersion]) {
            wrongIconNames.fileIcons.push(highContrastVersion);
        }
    }
};

/**
 * Check if the folder icons from the configuration are available on the file system.
 */
const checkFolderIcons = () => {
    [
        folderIcons.defaultIcon,
        folderIcons.rootFolder,
        ...folderIcons.icons.map(icon => icon.name),
        ...folderIcons.themes.map(theme => theme.defaultIcon)
    ].forEach(icon => {
        if (!availableIcons[icon] && icon) {
            wrongIconNames.folderIcons.push(icon);
        }
    });
};

/**
 * Check if the language icons from the configuration are available on the file system.
 */
const checkLanguageIcons = () => {
    languageIcons.languages.map(lang => lang.icon).forEach(icon => {
        if (!availableIcons[icon] && icon) {
            wrongIconNames.languageIcons.push(icon);
        }
    });
};

/**
 * Show error messages in the terminal.
 */
const printErrors = () => {
    const amountOfErrors = wrongIconNames.fileIcons.length + wrongIconNames.folderIcons.length + wrongIconNames.languageIcons.length;
    if (amountOfErrors > 0) {
        console.log('> Material Icon Theme:', painter.red(`Found ${amountOfErrors} error(s) in the icon configuration!`));
    } else {
        console.log('> Material Icon Theme:', painter.green(`Passed all icon configuration checks!`));
    }
    logIconInformation(wrongIconNames.fileIcons, 'File icons');
    logIconInformation(wrongIconNames.folderIcons, 'Folder icons');
    logIconInformation(wrongIconNames.languageIcons, 'Language icons');

    if (amountOfErrors > 0) {
        throw new Error('Found some wrong file definitions in the icon configuration.');
    }
};

const logIconInformation = (wrongIcons: string[], title: string) => {
    if (wrongIcons.length === 0) return;
    console.log(`\n${title}:\n--------------------------------`);
    wrongIcons.forEach(icon => {
        const suggestion = Object.keys(availableIcons).find((i) => {
            return similarity(icon, i) > 0.75;
        });
        const suggestionString = suggestion ? `- Did you mean ${painter.green(suggestion)}` : '';
        const isWrongLightVersion = icon.endsWith('_light');
        const isWrongLightVersionString = isWrongLightVersion ? `- There is no light icon for ${painter.green(icon.slice(0, -6))}! Set the light option to false!` : '';
        const isWrongHighContrastVersion = icon.endsWith('_highContrast');
        const isWrongHighContrastVersionString = isWrongHighContrastVersion ? `- There is no high contrast icon for ${painter.green(icon.slice(0, -13))}! Set the highContrast option to false!` : '';
        console.log(painter.red(`Icon not found: ${icon}`) + `${suggestionString}${isWrongLightVersionString}${isWrongHighContrastVersionString}`);
    });
};
