const shortcutVersion = 1.0;
const shortcutUrl = 'https://www.icloud.com/shortcuts/4a2127c98382489b8c1655121041656e';

const params = args.shortcutParameter;
const installedShortcutVersion = params.installedShortcutVersion;
const name = params.scriptName;
const fm = FileManager.iCloud();
const dir = fm.documentsDirectory();
const path = fm.joinPath(dir, name + ".js");

const newScript = params.newScript;
const oldScript = fm.readString(path);

// If there is no existing script just return the new script
if (!oldScript) {
  return {
    isInstalled: false,
    shortcutVersion: shortcutVersion,
    shortcutUrl: shortcutUrl,
    shortcutUrlEncoded: encodeURIComponent(shortcutUrl),
    hasShortcutUpdate: shortcutVersion > installedShortcutVersion,
  };
}

// Create array of lines for script files
const newScriptLines = newScript.split('\n');
const oldScriptLines = oldScript.split('\n');

const newVersion = getScriptVersion(newScriptLines);
const oldVersion = getScriptVersion(oldScriptLines);

// Get just the config blocks from the script files
const newConfig = getConfig(newScript);
const oldConfig = getConfig(oldScript);

// Merge changes from old config into the new one
const updatedConfig = updateConfig(oldConfig, newConfig);

// Apply all config changes to the new script and apply Scriptable config to the top
const updatedScript = (getScriptableConfig(oldScriptLines)) + ('\n') + (applyConfig(updatedConfig, newScript));

return {
  isInstalled: true,
  updatedScript: updatedScript,
  hasUpdate: newVersion !== oldVersion,
  newVersion: newVersion,
  previousVersion: oldVersion,
  shortcutVersion: shortcutVersion,
  shortcutUrl: shortcutUrl,
  shortcutUrlEncoded: encodeURIComponent(shortcutUrl),
  hasShortcutUpdate: shortcutVersion > installedShortcutVersion,
};

Script.complete();

// Functions
function getScriptableConfig(scriptLines) {
  // Takes array of lines as input
  if (!scriptLines || !scriptLines.length) {
    return '';
  }

  for (let i = 0; i < scriptLines.length; i++) {
    if (scriptLines[i].includes('Variables used by Scriptable')) {
      return scriptLines.slice(i, 3).join('\n');
    }
  }
  return '';
}

function getScriptVersion(scriptLines) {
  // Takes array of lines as input
  if (!scriptLines || !scriptLines.length) {
    return '';
  }
  for (let i = 0; i < scriptLines.length; i++) {
    if (scriptLines[i].includes('Version')) {
      let versionSplit = scriptLines[i].split(':');
      if (versionSplit && versionSplit[1]) {
        return versionSplit[1].trim();
      }
      return '';
    }
  }
  return '';
}

function applyConfig(config, script) {
  if (!config) {
    return script;
  }

  let scriptSplit = script.split('// Configuration');
  if (!scriptSplit.length) {
    return script;
  }
  let configSplit = scriptSplit[1].split('// End Configuration');
  configSplit[0] = config;

  configSplit = configSplit.join('// End Configuration');
  scriptSplit[1] = configSplit;
  scriptSplit = scriptSplit.join('// Configuration');

  return scriptSplit;
}

function getConfig(script) {
  if (!config) {
    return '';
  }
  let configSplit = script.split('// Configuration');
  if (!configSplit.length) {
    return '';
  }
  configSplit = configSplit[1].split('// End Configuration');
  configSplit = configSplit[0];
  return configSplit;
}

function updateConfig(oldConfig, newConfig) {
  const newConfigLines = newConfig.split('\n');
  let newConfigDefinitions = configToDefinitions(newConfigLines);

  const oldConfigLines = oldConfig.split('\n');
  let oldConfigDefinitions = configToDefinitions(oldConfigLines);

  Object.entries(oldConfigDefinitions).forEach(([key, configValue]) => {
    if (!newConfigDefinitions[key]) {
      return;
    }
    let lineNumber = newConfigDefinitions[key].lineNumber;
    newConfigDefinitions[key].oldValue = configValue.value;
    newConfigLines[lineNumber] = newConfigLines[lineNumber].replace(newConfigDefinitions[key].value, newConfigDefinitions[key].oldValue);
  });

  return newConfigLines.join('\n');
}

function configToDefinitions(configLines) {
  let configDefinitions = {};
  for (let i = 0; i < configLines.length; i++) {
    const configKeyValue = configToKeyValue(configLines[i], i);
    if (configKeyValue.key) {
      configDefinitions[configKeyValue.key] = configKeyValue.value;
    }
  }
  return configDefinitions;
}

function configToKeyValue(configLine, lineNumber) {
  const valueTokenString = '!!!!~~~~~~~~~||#||~~~~~~~~~!!!!'
  let configResult = {};
  let valueResult = {};
  let definitionSeparator;
  let closingCharacter;
  let hasDeclaration;
  if (configLine.includes('=')) {
    definitionSeparator = '=';
    closingCharacter = ';';
    hasDeclaration = true;
  }
  else if (configLine.includes(':')) {
    definitionSeparator = ':';
    closingCharacter = ',';
    hasDeclaration = false;
  }
  if (definitionSeparator) {
    // Replaced quoted content with temporary token
    const regexDouble = /"(.*?)"/; // Between double quotes
    const regexSingle = /'(.*?)'/; // Between single quotes
    let quotedValue = configLine.match(regexDouble) || configLine.match(regexSingle);
    if (quotedValue && quotedValue[1]) {
      configLine = configLine.replace(quotedValue[1], valueTokenString);
    }
    const configSplit = configLine.split(definitionSeparator);
    if (!configSplit.length) {
      return configResult;
    }
    
    let configValue = configSplit[1];

    // Replace temporary token with original value
    if (quotedValue && quotedValue[1]) {
      configValue = configValue.replace(valueTokenString, quotedValue[1]);
    }
    if (configValue !== null) {
      if (configValue.includes(closingCharacter)) {
        configValue = configValue.split(closingCharacter);
        configValue = configValue[0];
      }
      else if (configValue.includes('//')) {
        configValue = configValue.split('//');
        configValue = configValue[0];
      }

      configValue = configValue.trim();
    }
    
    const assignmentSplit = configSplit[0].split(' ');
    if (!assignmentSplit.length) {
      return configResult;
    }
    let assignment = hasDeclaration ? assignmentSplit[1] : assignmentSplit[0];
    if (!assignment) {
      return configResult;
    }
   
    assignment = assignment.trim();
    
    valueResult.value = typedValue(configValue);
    valueResult.lineNumber = lineNumber;
    
    configResult.key = assignment;
    configResult.value = valueResult;
    
    return configResult
  }
  return configResult;
}

function typedValue(value) {
  let numberCheck = Number(value);
  if (!isNaN(numberCheck)) {
    return numberCheck;
  }
  else {
    return value;
  }
}