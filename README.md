# jsx-to-str

A typescript transformer which transforms JSX into template literal strings **during the compilation phase of your program**. 

- Can't be bothered to learn the syntax of a template engine like pug, ejs or eta? 
- Worried about the performance overhead of said templating engines (parsing + compiling)? 
- Tired of working with outdated and barely working VSCode plugins for said templating engines?
- Want something more closely integrated to typescript, allowing you to write safe, clean and reusable code?

... then this is perfect for you! `jsx-to-str` turns JSX syntax to regular template strings during compilation! Use the speed of V8 for parsing and running the templates!

## Usage

You can use this either by using `ttypescript` or `webpack`

### TTypescript

- Install ttypescript: `npm i -g ttypescript`
- Add this to your compiler options:
```js
        "plugins": [
            { "transform": "tsx-to-str" },
        ]
```
- Run ttypescript: `ttsc`

### Webpack (with ts-loader)

```js
const TsxToJs = require("tsx-to-js");

options: {
      getCustomTransformers: program => {
        before: [TsxToJs(program, { customConfig: true })],
        after: [TsxToJs(program, { customConfig: true })],
      }
}
```


## A taste

Original:
```tsx
type User = { name: string, age: number };

function User(props: User) {
    return <div>name: {props.name}, age: {props.age}</div>;
}

export function UserList(props: { users: Array<User> }) {
    return <ul>
        {...props.users.map(user => <li><User {...user}></User></li>)}
    </ul>;
}

console.log(UserList({
    users: [
        { name: "Google", age: 72 },
        { name: "Yahoo", age: 19 },
        { name: "Hidden", age: 33 }
    ]
}));
```

Transpiled:
```js
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserList = void 0;
function User(props) {
    return `<div>name: ${props.name}, age: ${props.age}</div>`;
}
function UserList(props) {
    return `<ul>\r\n        ${props.users.map(user => `<li>${User(user, "")}</li>`).join("")}\r\n    </ul>`;
}
exports.UserList = UserList;
```

Console log:
```
<ul>
        <li><div>name: Google, age: 72</div></li><li><div>name: Yahoo, age: 19</div></li><li><div>name: Hidden, age: 33</div></li>
</ul>
```