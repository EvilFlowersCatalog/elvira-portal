class Theme {
    static readonly type = '[Common] Theme';
    constructor(public payload: { theme: string }) {}
}

export { Theme };
