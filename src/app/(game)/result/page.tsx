"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { quizService } from "@/features/quiz/service";
import type { CompleteQuizData } from "@/types/api";
import Creature from "@/components/pixel/Creature";
import Icon from "@/components/pixel/Icon";
import styles from "./page.module.scss";

export default function ResultPage() {
 const router=useRouter(); const [data,setData]=useState<CompleteQuizData|null>(null); const [error,setError]=useState("");
 useEffect(()=>{const id=Number(sessionStorage.getItem("quizSessionId")); if(!id){router.replace("/topic");return;} quizService.complete(id).then(setData).catch((e:Error)=>setError(e.message));},[router]);
 if(error)return <><p role="alert">{error}</p><button onClick={()=>router.push("/home")}>홈으로</button></>; if(!data)return <p>보상을 정산하는 중...</p>;
 const total=data.session.total_question_count, correct=data.session.correct_count, acc=Math.round(correct/total*100), growth=data.character_growth;
 return <><div className={styles.head}><h1 className={styles.title}>학습 완료!</h1><p className={styles.sub}>{acc===100?"완벽해요!":acc>=60?"잘했어요!":"다음엔 더 잘할 수 있어요"}</p></div><div className={styles.creature}><Creature state={correct>=Math.ceil(total/2)?"correct":"sulk"} size={100}/></div><div className={styles.card}><p className={styles.label}>정답</p><p className={styles.bignum}>{correct} <span>/ {total}문제</span></p><div className={styles.bar}><i style={{width:`${acc}%`}}/></div><p className={styles.label}>정답률 {acc}%</p></div><div className={styles.stats}><div className={styles.stat}><div className={styles.ico}><Icon name="star" size={26}/></div><div className={styles.label}>획득 EXP</div><div className={styles.big}>{data.rewards.exp>=0?"+":""}{data.rewards.exp}</div></div><div className={styles.stat}><div className={styles.ico}><Icon name="coin" size={26}/></div><div className={styles.label}>획득 코인</div><div className={styles.big}>+{data.rewards.coins+data.rewards.level_up_bonus_coins}</div></div><div className={styles.stat}><div className={styles.ico}><Icon name="fire" size={26}/></div><div className={styles.label}>연속 학습</div><div className={styles.big}>{data.streak.current_streak}일</div></div></div>{growth.after_level>growth.before_level&&<p>레벨 {growth.after_level} 달성{growth.hatched?" · 알이 부화했어요!":""}</p>}<div className={styles.grow}/><button className={styles.btn} onClick={()=>{sessionStorage.removeItem("quizSessionId");router.push("/home");}}>홈으로 돌아가기</button></>;
}
