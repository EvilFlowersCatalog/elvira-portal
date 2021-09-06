import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { Theme } from './common.actions';
import { CommonStateModel } from './common.model';

export const THEME_LIGHT = 'elib-light-theme';
export const THEME_DARK = 'elib-dark-theme';

@State<CommonStateModel>({
    name: 'common',
    defaults: {
        theme: THEME_LIGHT,
    },
})
@Injectable()
export class CommonState {
    @Selector()
    static theme$(state: CommonStateModel) {
        return state.theme;
    }

    @Action(Theme)
    public theme({ patchState }: StateContext<CommonStateModel>, { payload }: Theme) {
        const { theme } = payload;
        return patchState({ theme });
    }
}
