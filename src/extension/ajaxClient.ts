import { DOMAIN_NAME,PRIVATE_TOKEN } from './constants/environmentVariables';

async function fetchBuilder(method,path){
    return fetch(`https://${DOMAIN_NAME}/api/v4/${path}`,
    {
        method: `${method}`,
        headers: {
        'PRIVATE-TOKEN': PRIVATE_TOKEN
        }
    })
}
export async function GET(path){
    return fetchBuilder('GET',path);
}
export async function PUT(path){
    return fetchBuilder('PUT',path);
}
export * as ajaxClient from "./ajaxClient"