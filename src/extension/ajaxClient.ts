import { DOMAIN_NAME,PRIVATE_TOKEN } from './constants/environmentVariables';

export async function GET(path){
    return fetch(`https://${DOMAIN_NAME}/api/v4/${path}`,
    {
        method: 'GET',
        headers: {
        'PRIVATE-TOKEN': PRIVATE_TOKEN
        }
    })
}
export * as ajaxClient from "./ajaxClient"