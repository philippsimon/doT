declare module DotCore {
  export interface settings {
    mangles?: any;
    tags?: any;
    varname?: string;
    strip?: boolean;
    with?: boolean;
    dynamicList?: string;
    append?: boolean;
    startend?: {
      append: {
        start: string;
        end: string;
        startencode: string;
      },
      split: {
        start: string;
        end: string;
        startencode: string;
      }
    };
    selfcontained?: boolean;
    unescape?: any;
    resolveDefs?: any;
    defineParams?: RegExp;
    useParams?: RegExp;
    doNotSkipEncoded?: boolean;
  }

  export module compile_args {
    export interface compileParams {
      multiple_contents?: boolean;
      def?: any;
      doT?: any;
    }
  }

  export module render_args {
    export interface tmpl {
      name: string;
      args: any;
    }
  }
}