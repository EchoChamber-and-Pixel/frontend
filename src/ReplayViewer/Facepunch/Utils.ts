import { LZString } from './';

export class Http {
    static readonly cancelled: any = { toString: () => "Request cancelled by user." };

    static getString(url: string, success: (response: string) => void, failure?: (error: any) => void, progress?: (loaded: number, total: number | undefined) => void): void {
        var request = new XMLHttpRequest();

        request.addEventListener("load", ev => success(request.responseText));

        if (failure != null) {
            request.addEventListener("error", ev => failure((ev as any).error));
            request.addEventListener("abort", ev => failure(Http.cancelled));
        }

        if (progress != null) {
            request.onprogress = ev => ev.lengthComputable
                ? progress(ev.loaded, ev.total) : progress(0, undefined);
        }

        request.open("get", url, true);
        request.send();
    }

    static getJson<TResponse>(url: string, success: (response: TResponse) => void, failure?: (error: any) => void, progress?: (loaded: number, total: number | undefined) => void): void {
        Http.getString(url, text => success(JSON.parse(text)), failure, progress);
    }

    static getImage(url: string, success: (response: HTMLImageElement) => void, failure?: (error: any) => void, progress?: (loaded: number, total: number | undefined) => void): void {
        const image = new Image();
        image.src = url;
        image.addEventListener("load", ev => success(image));
        
        if (failure != null) {
            image.addEventListener("error", ev => failure(ev.error));
            image.addEventListener("abort", ev => failure(Http.cancelled));
        }
        
        if (progress != null) {
            image.onprogress = ev => ev.lengthComputable
                ? progress(ev.loaded, ev.total) : progress(0, undefined);
        }
    }

    static isAbsUrl(url: string): boolean {
        return url != null && /^(http[s]:\/)?\//i.test(url);
    }

    static getAbsUrl(url: string, relativeTo: string): string {
        if (Http.isAbsUrl(url)) return url;
        if (!Http.isAbsUrl(relativeTo)) {
            relativeTo = window.location.pathname;
        }

        if (relativeTo.charAt(relativeTo.length - 1) === "/") {
            return `${relativeTo}${url}`;
        }

        const lastSep = relativeTo.lastIndexOf("/");
        const prefix = relativeTo.substr(0, lastSep + 1);

        return `${prefix}${url}`;
    }
}

export class Utils {
    static decompress<T>(value: string | T): T | null {
        if (value == null) return null;
        return typeof value === "string"
            ? JSON.parse(LZString.decompressFromBase64(value) as string)
            : value as T;
    }

    static decompressOrClone<T>(value: string | T[]): T[] | null
    {
        if (value == null) return null;
        return typeof value === "string"
            ? JSON.parse(LZString.decompressFromBase64(value) as string)
            : (value as T[]).slice(0);
    }
}

export class WebGl {
    static decodeConst<TEnum extends number>(valueOrIdent: TEnum | string, defaultValue?: TEnum): TEnum {
        if (valueOrIdent === undefined) return defaultValue as TEnum;
        return (typeof valueOrIdent === "number" ? valueOrIdent : getProperty(WebGLRenderingContext, valueOrIdent as any)) as TEnum;
    }

    private static constDict: {[value:number]: string};

    static encodeConst(value: number): string {
        if (WebGl.constDict == null) {
            WebGl.constDict = {};

            for (let name in WebGLRenderingContext) {
                const val = getProperty(WebGLRenderingContext, name as any);
                if (typeof val !== "number") continue;
                WebGl.constDict[val] = name;
            }
        }

        return WebGl.constDict[value];
    }
}

// https://www.typescriptlang.org/docs/handbook/advanced-types.html#index-types
function getProperty<T, K extends keyof T>(o: T, propertyName: K): T[K] {
    return o[propertyName];
}