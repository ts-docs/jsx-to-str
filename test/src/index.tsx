

export function test(arg: string) {
    //@ts-expect-error reeee
    return <div className={arg} b={arg + "World"}>Hello {"world"}</div>;
}