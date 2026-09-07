"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { gameService } from "@/features/game/service";
import { getRankings } from "@/features/ranking/service";
import type { HomeData } from "@/types/api";
import type { EggEquip, PetEquip, PetKey } from "@/types/game";
import Creature from "@/components/pixel/Creature";
import Icon from "@/components/pixel/Icon";
import styles from "./page.module.scss";

function petKey(sprite:string):PetKey{return (["bunny","cat","hamster"].includes(sprite)?sprite:"bunny") as PetKey;}
export default function HomePage(){const router=useRouter();const [home,setHome]=useState<HomeData|null>(null),[rank,setRank]=useState<number|null>(null),[inventoryCount,setInventoryCount]=useState(0),[error,setError]=useState("");
 useEffect(()=>{Promise.all([gameService.home(),getRankings(),gameService.inventory()]).then(([h,r,i])=>{setHome(h);setRank(r.me?.rank??null);setInventoryCount(i.items.length);}).catch((e:Error)=>setError(e.message));},[]);
 if(error)return <p role="alert">{error}</p>;if(!home)return <p>홈을 불러오는 중...</p>;const c=home.character, max=c.required_exp||1,hatched=c.growth_stage!=="egg";const all=c.equipment;const equipped:PetEquip={hat:all.hat?.asset_key??null,glasses:all.glasses?.asset_key??null};const eggEquip:EggEquip={pattern:all.pattern?.asset_key??null,hat:all.hat?.asset_key??null,nest:all.nest?.asset_key??null};
 return <><div className={styles.topbar}><span className={styles.pill}>Lv.{c.level} <b>{home.profile.nickname||"펫집사"}</b></span><span className={`${styles.pill} ${styles.coin}`}><Icon name="coin" size={18}/> {home.profile.coins}</span></div><div className={styles.expCard}><div className={styles.expRow}><span className={styles.label}>EXP</span><span className={styles.label}>{c.exp} / {max}</span></div><div className={styles.bar}><i style={{width:`${Math.min(100,c.exp/max*100)}%`}}/></div></div><div className={styles.stage}><div className={styles.bubble}>{hatched?"오늘도 함께 성장해요!":"문제를 풀어 레벨업하면 알이 부화해요!"}</div><Creature state="idle" size={130} petSize={96} serverState={{hatched,pet:petKey(c.character_type.sprite_key),equipped,eggEquip}}/></div><div className={styles.stats}><button className={styles.stat} onClick={()=>router.push("/ranking")}><div className={styles.ico}><Icon name="crown" size={26}/></div><div className={styles.label}>내 순위</div><div className={styles.big}>{rank?`${rank}위`:"-"}</div></button><button className={styles.stat} onClick={()=>router.push("/record")}><div className={styles.ico}><Icon name="fire" size={26}/></div><div className={styles.label}>연속 학습</div><div className={styles.big}>{home.streak.current_streak}일</div></button><button className={styles.stat} onClick={()=>router.push("/wardrobe")}><div className={styles.ico}><Icon name="shirt" size={26}/></div><div className={styles.label}>옷장</div><div className={styles.big}>{inventoryCount}개</div></button></div><button className={styles.quizBtn} onClick={()=>router.push("/topic")}>{home.today_quiz?.status==="in_progress"?"오늘의 문제 이어 풀기 ▶":"오늘의 문제 풀기 ▶"}</button><button onClick={async()=>{await createClient().auth.signOut();router.replace("/login");router.refresh();}}>로그아웃</button></>;
}
