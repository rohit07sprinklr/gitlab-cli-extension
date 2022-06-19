async function main(){
const res = await fetch(`http://localhost:4000/profiles`);
const resJson = await res.json();
console.log(resJson);
}
main();
