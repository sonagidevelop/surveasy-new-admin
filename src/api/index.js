import axios from 'axios';
import { setInterceptors } from './common/interceptors';

function createInstance() {
	const instance = axios.create();
  instance.defaults.baseURL = 'https://gosurveasy.co.kr'
	//instance.defaults.baseURL = 'https://surveasy.store'
	return instance;
}
export const instance = createInstance();

function createInstanceWithAuth() {
	const instance = axios.create();
  instance.defaults.baseURL = 'https://gosurveasy.co.kr'
	//instance.defaults.baseURL = 'https://surveasy.store'
	return setInterceptors(instance);
}
export const instanceWithAuth = createInstanceWithAuth();