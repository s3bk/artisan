const sizes = [400, 600, 1000];

const IMG_INFO = fetch("images.json").then(r => r.text());

type ColConfig = {
    n_columns: number,
    columns: HTMLElement[],
    col_width: number,
    margin: number,
    column_height: number[],
};


function add_image(config: ColConfig, src: string, ar: number) {
    const img = new Image();
    img.loading = "lazy";
    img.src = src;
    const img_width = config.col_width - config.margin;
    const img_height = img_width * ar;
    img.style.height = img_height + "vw";
    img.style.width = img_width + "vw";

    // find smallest column
    let min_idx = 0;
    let min_height = config.column_height[0];
    for (const [i, h] of config.column_height.entries()) {
        if (h < min_height) {
            min_idx = i;
        }
    }

    config.columns[min_idx].appendChild(img);
    config.column_height[min_idx] += img.height + config.margin;
}

function select_columns(): ColConfig {
    const n_columns = Math.min(Math.floor(window.innerWidth / 400), 4);
    const columns: HTMLElement[] = [];
    const col_width = 100/n_columns;
    const margin = 2.;
    const column_height: number[] = [];
    for (var i=0; i < n_columns; i++) {
        column_height.push(0.0);
        const e = document.createElement("div");
        e.style.width = col_width + "vw";
        columns.push(e);
    }

    return {
        n_columns,
        columns,
        col_width,
        column_height,
        margin
    };
}

function select_size(config: ColConfig): number {
    let size = sizes[0];
    const img_width = window.innerWidth * window.devicePixelRatio * (config.col_width - config.margin) / 100.;
    for (const s of sizes) {
        if (s < img_width) {
            size = s;
        }
    }
    return size;
}

async function init() {
    const container = document.createElement("div");
    container.classList.add("flow");
    document.body.appendChild(container);

    const config = select_columns();
    const size = select_size(config);
    container.append(... config.columns);

    let img_info_text = await IMG_INFO;
    const images: [[number, number]] = JSON.parse(img_info_text);

    let i = 0;
    function next() {
        if (i < images.length) {
            const [id, ar] = images[i];
            const id_str = String(id).padStart(5, "0");
            add_image(config, `img/${size}/${id_str}.webp`, ar);
            setTimeout(next, 500);
            i += 1;
        }
    }
    setTimeout(next, 100);
}


if (document.readyState === 'complete') {
    init();
} else {
    document.addEventListener("DOMContentLoaded", init);
}
