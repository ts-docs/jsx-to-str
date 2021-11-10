
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../node_modules/jsx-to-str/jsx.d.ts" />

function Something(params: {a: number, b: number}, children: string) {
    return <>aaaa{params.a} + {params.b}<>{children}</></>;
}

console.log(<html>
    <head>
        <meta charSet="utf-8"> </meta>
        <meta name={`aaa${"Hello"}`} contentEditable={"yes"} content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title><Something a={5} b={33}>Hello World</Something></title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" crossOrigin="anonymous"></link>
        <link id="highlightTheme" rel="stylesheet" crossOrigin="anonymous"></link>
    </head>
    <body>
        <div class={`${"World" + "No"}Hello`}>

        </div>
    </body>
</html>);