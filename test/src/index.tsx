
function Test(props: Record<string, unknown>, children: string) {
    return <div>{children}</div>;
}

const obj = { id: "100" };
export function test(arg: string, arg2: Array<number>) {
    return <div className={arg} {...obj}>
        <p>Hello World, how are ya?</p>
        <Test name="Test" arg>
            321<p>{123}</p>
        </Test>
        <div>
            {arg2.filter(el => el % 2 === 0).map(el => <p>{el}</p>).join("")}
        </div>
    </div>;
}

console.log(test("Volen", [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]));