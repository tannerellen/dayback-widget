let params = args.shortcutParameter;
let name = params.scriptName;
let fm = FileManager.iCloud();
let dir = fm.documentsDirectory();
let path = fm.joinPath(dir, name + ".js");

const newScript = params.newScript;
const oldScript = fm.readString(path);

// If there is no existing script just return the new script
if (!oldScript) {
  return newScript;
}

// Get just the config blocks from the script files
const oldConfig = getConfig(oldScript);
const newConfig = getConfig(newScript);

// Merge changes from old config into the new one
const updatedConfig = updateConfig(oldConfig, newConfig);

// Apply all config changes to the new script
const updatedScript = applyConfig(updatedConfig, newScript);

return updatedScript;
Script.complete(fileContent);

// Functions
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
  const newConfigLines = newConfig.split('/n');
  let newConfigDefinitions = configToDefinitions(newConfigLines);

  const oldConfigLines = oldConfig.split('/n');
  let oldConfigDefinitions = configToDefinitions(oldConfigLines);
  console.log(newConfigDefinitions);

  Object.entries(oldConfigDefinitions).forEach(([key, configValue]) => {
    if (!newConfigDefinitions[key]) {
      return;
    }
    let lineNumber = newConfigDefinitions[key].lineNumber;
    newConfigDefinitions[key].oldValue = configValue.value;
    newConfigLines[lineNumber] = newConfigLines[lineNumber].replace(newConfigDefinitions[key].value, newConfigDefinitions[key].oldValue);
  });

  return newConfigLines.join('/n');
}

function configToDefinitions(configLines) {
  let configDefinitions = {};
  for (let i = 0; i < configLines.length; i++) {
    const configKeyValue = configToKeyValue(configLines[i], i);
    console.log(configKeyValue);
    if (configKeyValue.key) {
      configDefinitions[configKeyValue.key] = configKeyValue.value;
    }
  }
  return configDefinitions;
}

function configToKeyValue(configLine, lineNumber) {
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
    const configSplit = configLine.split(definitionSeparator);
    if (!configSplit.length) {
      return configResult;
    }
    
    let configValue = configSplit[1];
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
    console.log('assignmentSplit', assignmentSplit);
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