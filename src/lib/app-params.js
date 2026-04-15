const isNode = typeof window === 'undefined';
const windowObj = isNode ? { localStorage: new Map() } : window;
const storage = windowObj.localStorage;

const toSnakeCase = (str) => {
	return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

const getAppParamValue = (paramName, { defaultValue = undefined, removeFromUrl = false } = {}) => {
	if (isNode) {
		return defaultValue;
	}
	const storageKey = `base44_${toSnakeCase(paramName)}`;
	const urlParams = new URLSearchParams(window.location.search);
	const searchParam = urlParams.get(paramName);
	if (removeFromUrl) {
		urlParams.delete(paramName);
		const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ""
			}${window.location.hash}`;
		window.history.replaceState({}, document.title, newUrl);
	}
	
	// 1. URL param overrides everything
	if (searchParam) {
		storage.setItem(storageKey, searchParam);
		return searchParam;
	}

	// 2. IMPORTANT: For app_id, always prioritize the environment's defaultValue over potentially stale localStorage.
	// This prevents the app from using an old database if the env var was changed.
	if (paramName === "app_id" && defaultValue) {
		storage.setItem(storageKey, defaultValue);
		return defaultValue;
	}

	// 3. For access_token, prioritize localStorage over defaultValue (the API Key) so we don't overwrite user sessions!
	const storedValue = storage.getItem(storageKey);
	if (storedValue) {
		return storedValue;
	}

	// 4. Final fallback
	if (defaultValue) {
		storage.setItem(storageKey, defaultValue);
		return defaultValue;
	}
	
	return null;
}

const getAppParams = () => {
	if (getAppParamValue("clear_access_token") === 'true') {
		storage.removeItem('base44_access_token');
		storage.removeItem('token');
		storage.removeItem('base44_app_id');
	}
	return {
		appId: getAppParamValue("app_id", { defaultValue: import.meta.env.VITE_BASE44_APP_ID }),
		token: getAppParamValue("access_token", { defaultValue: import.meta.env.VITE_BASE44_ACCESS_TOKEN, removeFromUrl: true }),
		fromUrl: getAppParamValue("from_url", { defaultValue: window.location.href }),
		functionsVersion: getAppParamValue("functions_version", { defaultValue: import.meta.env.VITE_BASE44_FUNCTIONS_VERSION }),
		appBaseUrl: getAppParamValue("app_base_url", { defaultValue: import.meta.env.VITE_BASE44_APP_BASE_URL }),
	}
}


export const appParams = {
	...getAppParams()
}
