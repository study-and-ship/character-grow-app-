"use client";
import {createContext,useCallback,useContext,useMemo,useState} from "react";
import type{EggEquip,PetEquip,PetKey}from"@/types/game";

interface GameUiContext {hatched:boolean;pet:PetKey;equipped:PetEquip;eggEquip:EggEquip;toast:string|null;showToast(message:string):void;clearToast():void}
const Context=createContext<GameUiContext|null>(null);

/** Only ephemeral presentation state lives here; persistent game data is loaded from APIs by each feature. */
export function GameProvider({children}:{children:React.ReactNode}){const[toast,setToast]=useState<string|null>(null);const clearToast=useCallback(()=>setToast(null),[]);const showToast=useCallback((message:string)=>setToast(message),[]);const value=useMemo<GameUiContext>(()=>({hatched:false,pet:"bunny",equipped:{hat:null,glasses:null},eggEquip:{pattern:null,hat:null,nest:null},toast,showToast,clearToast}),[toast,showToast,clearToast]);return <Context.Provider value={value}>{children}</Context.Provider>}
export function useGame(){const value=useContext(Context);if(!value)throw new Error("useGame must be used within <GameProvider>");return value}
