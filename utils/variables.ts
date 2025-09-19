import { KeyValue, VariableType } from '../types';

export const castVariable = (variable: KeyValue): any => {
    const type = variable.type || VariableType.AUTO;
    const { value } = variable;

    switch (type) {
        case VariableType.STRING:
            return value;
        case VariableType.NUMBER:
            const num = Number(value);
            return isNaN(num) ? value : num;
        case VariableType.BOOLEAN:
            if (value.toLowerCase() === 'true') return true;
            if (value.toLowerCase() === 'false') return false;
            return Boolean(value);
        case VariableType.JSON:
            try {
                return JSON.parse(value);
            } catch {
                return value; // Return as string if JSON is invalid
            }
        case VariableType.AUTO:
        default:
            if (value.toLowerCase() === 'true') return true;
            if (value.toLowerCase() === 'false') return false;
            const autoNum = Number(value);
            if (!isNaN(autoNum) && value.trim() !== '') return autoNum;
            try {
                // Check if it's a valid JSON object/array, but only if it looks like one.
                if ((value.startsWith('{') && value.endsWith('}')) || (value.startsWith('[') && value.endsWith(']'))) {
                     return JSON.parse(value);
                }
            } catch {}
            return value;
    }
};


export const substituteVariables = (input: string, environment: KeyValue[]): any => {
    if (typeof input !== 'string') return input;

    const trimmedInput = input.trim();
    const enabledVars = environment.filter(v => v.enabled && v.key);

    // Check for whole-variable substitution first (e.g., body is just "{{my_json}}")
    const match = trimmedInput.match(/^\{\{\s*([_a-zA-Z0-9]+)\s*\}\}$/);
    if (match) {
        const varName = match[1];
        const variable = enabledVars.find(v => v.key === varName);
        if (variable) {
            return castVariable(variable);
        }
    }
    
    // Otherwise, perform string interpolation
    let substituted = input;
    for (const variable of enabledVars) {
        const regex = new RegExp(`\\{\\{\\s*${variable.key}\\s*\\}\\}`, 'g');
        const castedValue = castVariable(variable);

        // Don't substitute objects/arrays into a string, use their string representation
        const replacement = typeof castedValue === 'object' ? JSON.stringify(castedValue) : String(castedValue);
        substituted = substituted.replace(regex, replacement);
    }
    
    return substituted;
};