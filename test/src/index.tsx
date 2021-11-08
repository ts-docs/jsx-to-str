import "jsx-to-str";

type User = { name: string, age: number };

function User(props: User & { isBad: boolean }) {
    return <div>name: {props.name}, age: {props.age}</div>;
}

export function UserList(props: { users: Array<User> }) {
    return <ul>
        {...props.users.map(user => <li><User {...user} isBad={true}></User></li>)}
    </ul>;
}


console.log(UserList({
    users: [
        { name: "Google", age: 72 },
        { name: "Yahoo", age: 19 },
        { name: "Hidden", age: 33 }
    ]
}));