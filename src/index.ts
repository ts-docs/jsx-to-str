import * as ts from "typescript";
import { visitor } from "./compiler";

export default (): ts.TransformerFactory<ts.Node> => ctx => {
    return firstNode => {
        return visitor(ctx, firstNode) || firstNode;
    };
};

// eslint-disable-next-line @typescript-eslint/no-namespace
declare global {
// eslint-disable-next-line @typescript-eslint/no-namespace
    namespace JSX {

    export interface IntrinsicElements {
        // HTML
        a: Record<string, unknown>;
        abbr: Record<string, unknown>;
        address: Record<string, unknown>;
        area: Record<string, unknown>
        article: Record<string, unknown>;
        aside: Record<string, unknown>;
        audio: Record<string, unknown>
        b: Record<string, unknown>;
        base: Record<string, unknown>
        bdi: Record<string, unknown>;
        bdo: Record<string, unknown>;
        big: Record<string, unknown>;
        blockquote: Record<string, unknown>
        body: Record<string, unknown>
        br: Record<string, unknown>
        button: Record<string, unknown>
        canvas: Record<string, unknown>
        caption: Record<string, unknown>;
        cite: Record<string, unknown>;
        code: Record<string, unknown>;
        col: Record<string, unknown>
        colgroup: Record<string, unknown>
        data: Record<string, unknown>
        datalist: Record<string, unknown>
        dd: Record<string, unknown>;
        del: Record<string, unknown>
        details: Record<string, unknown>
        dfn: Record<string, unknown>;
        dialog: Record<string, unknown>
        div: Record<string, unknown>
        dl: Record<string, unknown>
        dt: Record<string, unknown>;
        em: Record<string, unknown>;
        embed: Record<string, unknown>
        fieldset: Record<string, unknown>
        figcaption: Record<string, unknown>;
        figure: Record<string, unknown>;
        footer: Record<string, unknown>;
        form: Record<string, unknown>
        h1: Record<string, unknown>
        h2: Record<string, unknown>
        h3: Record<string, unknown>
        h4: Record<string, unknown>
        h5: Record<string, unknown>
        h6: Record<string, unknown>
        head: Record<string, unknown>
        header: Record<string, unknown>;
        hgroup: Record<string, unknown>;
        hr: Record<string, unknown>
        html: Record<string, unknown>
        i: Record<string, unknown>;
        iframe: Record<string, unknown>
        img: Record<string, unknown>
        input: Record<string, unknown>
        ins: Record<string, unknown>
        kbd: Record<string, unknown>;
        keygen: Record<string, unknown>
        label: Record<string, unknown>
        legend: Record<string, unknown>
        li: Record<string, unknown>
        link: Record<string, unknown>
        main: Record<string, unknown>;
        map: Record<string, unknown>
        mark: Record<string, unknown>;
        menu: Record<string, unknown>
        menuitem: Record<string, unknown>;
        meta: Record<string, unknown>
        meter: Record<string, unknown>
        nav: Record<string, unknown>;
        noindex: Record<string, unknown>;
        noscript: Record<string, unknown>;
        object: Record<string, unknown>
        ol: Record<string, unknown>
        optgroup: Record<string, unknown>
        option: Record<string, unknown>
        output: Record<string, unknown>
        p: Record<string, unknown>
        param: Record<string, unknown>
        picture: Record<string, unknown>;
        pre: Record<string, unknown>
        progress: Record<string, unknown>
        q: Record<string, unknown>
        rp: Record<string, unknown>;
        rt: Record<string, unknown>;
        ruby: Record<string, unknown>;
        s: Record<string, unknown>;
        samp: Record<string, unknown>;
        slot: Record<string, unknown>
        script: Record<string, unknown>
        section: Record<string, unknown>;
        select: Record<string, unknown>
        small: Record<string, unknown>;
        source: Record<string, unknown>
        span: Record<string, unknown>
        strong: Record<string, unknown>;
        style: Record<string, unknown>
        sub: Record<string, unknown>;
        summary: Record<string, unknown>;
        sup: Record<string, unknown>;
        table: Record<string, unknown>
        template: Record<string, unknown>
        tbody: Record<string, unknown>
        td: Record<string, unknown>
        textarea: Record<string, unknown>
        tfoot: Record<string, unknown>
        th: Record<string, unknown>
        thead: Record<string, unknown>
        time: Record<string, unknown>
        title: Record<string, unknown>
        tr: Record<string, unknown>
        track: Record<string, unknown>
        u: Record<string, unknown>;
        ul: Record<string, unknown>
        "var": Record<string, unknown>;
        video: Record<string, unknown>
        wbr: Record<string, unknown>;
        webview: Record<string, unknown>

        // SVG
        svg: Record<string, unknown>

        animate: Record<string, unknown>
        animateMotion: Record<string, unknown>
        animateTransform: Record<string, unknown>
        circle: Record<string, unknown>
        clipPath: Record<string, unknown>
        defs: Record<string, unknown>
        desc: Record<string, unknown>
        ellipse: Record<string, unknown>
        feBlend: Record<string, unknown>
        feColorMatrix: Record<string, unknown>
        feComponentTransfer: Record<string, unknown>
        feComposite: Record<string, unknown>
        feConvolveMatrix: Record<string, unknown>
        feDiffuseLighting: Record<string, unknown>
        feDisplacementMap: Record<string, unknown>
        feDistantLight: Record<string, unknown>
        feDropShadow: Record<string, unknown>
        feFlood: Record<string, unknown>
        feFuncA: Record<string, unknown>
        feFuncB: Record<string, unknown>
        feFuncG: Record<string, unknown>
        feFuncR: Record<string, unknown>
        feGaussianBlur: Record<string, unknown>
        feImage: Record<string, unknown>
        feMerge: Record<string, unknown>
        feMergeNode: Record<string, unknown>
        feMorphology: Record<string, unknown>
        feOffset: Record<string, unknown>
        fePointLight: Record<string, unknown>
        feSpecularLighting: Record<string, unknown>
        feSpotLight: Record<string, unknown>
        feTile: Record<string, unknown>
        feTurbulence: Record<string, unknown>
        filter: Record<string, unknown>
        foreignObject: Record<string, unknown>
        g: Record<string, unknown>
        image: Record<string, unknown>
        line: Record<string, unknown>
        linearGradient: Record<string, unknown>
        marker: Record<string, unknown>
        mask: Record<string, unknown>
        metadata: Record<string, unknown>
        mpath: Record<string, unknown>
        path: Record<string, unknown>
        pattern: Record<string, unknown>
        polygon: Record<string, unknown>
        polyline: Record<string, unknown>
        radialGradient: Record<string, unknown>
        rect: Record<string, unknown>
        stop: Record<string, unknown>
        switch: Record<string, unknown>
        symbol: Record<string, unknown>
        text: Record<string, unknown>
        textPath: Record<string, unknown>
        tspan: Record<string, unknown>
        use: Record<string, unknown>
        view: Record<string, unknown>
    }
}

}