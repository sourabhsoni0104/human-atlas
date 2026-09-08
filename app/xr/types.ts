export type XRMode='desktop'|'mr'|'vr';

export interface XRSupport {
 supported:boolean;
 mrSupported:boolean;
 vrSupported:boolean;
}

export interface XRState extends XRSupport {
 presenting:boolean;
 mode:XRMode;
}

export type ImmersiveXRMode=Exclude<XRMode,'desktop'>;
