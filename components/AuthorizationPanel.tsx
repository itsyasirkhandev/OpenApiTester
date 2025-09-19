
import React from 'react';
import { AuthConfig, AuthType, Environment } from '../types';
import VariableSuggestionInput from './VariableSuggestionInput';

interface AuthorizationPanelProps {
    auth: AuthConfig;
    onChange: (auth: AuthConfig) => void;
    environment: Environment;
}

const AuthorizationPanel: React.FC<AuthorizationPanelProps> = ({ auth, onChange, environment }) => {
    
    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onChange({ type: e.target.value as AuthType });
    }

    return (
        <div className="p-2 space-y-4">
            <div>
                <label htmlFor="auth-type" className="block text-sm font-medium text-slate-400 mb-1">
                    Type
                </label>
                <select
                    id="auth-type"
                    value={auth.type}
                    onChange={handleTypeChange}
                    className="w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                    {Object.values(AuthType).map(type => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
            </div>

            {auth.type === AuthType.BEARER && (
                <div>
                    <label htmlFor="bearer-token" className="block text-sm font-medium text-slate-400 mb-1">
                        Token
                    </label>
                    <VariableSuggestionInput
                        type="text"
                        id="bearer-token"
                        value={auth.bearerToken || ''}
                        onChange={(e) => onChange({ ...auth, bearerToken: e.target.value })}
                        placeholder="Enter your bearer token or select a variable"
                        className="w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-sm focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                        environment={environment}
                    />
                </div>
            )}

            {auth.type === AuthType.BASIC && (
                <div className="space-y-2">
                    <div>
                        <label htmlFor="basic-username" className="block text-sm font-medium text-slate-400 mb-1">
                            Username
                        </label>
                        <VariableSuggestionInput
                            type="text"
                            id="basic-username"
                            value={auth.basicUsername || ''}
                            onChange={(e) => onChange({ ...auth, basicUsername: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            environment={environment}
                        />
                    </div>
                     <div>
                        <label htmlFor="basic-password" className="block text-sm font-medium text-slate-400 mb-1">
                            Password
                        </label>
                        <VariableSuggestionInput
                            type="password"
                            id="basic-password"
                            value={auth.basicPassword || ''}
                            onChange={(e) => onChange({ ...auth, basicPassword: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            environment={environment}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuthorizationPanel;
