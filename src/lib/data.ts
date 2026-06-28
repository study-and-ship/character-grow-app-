import type { PetKey, Mood, Topic, Question } from "@/types/game";

/** 기분별 말풍선 문구 */
export const MOOD_MSG: Record<Mood, string> = {"idle":"오늘도 열심히 해보자!","happy":"신난다~ ♪","correct":"정답이야! 잘했어!","angry":"으악 틀렸어!!","sulk":"심심해... 공부하자","sleepy":"졸려... 한 문제만 더..."} as Record<Mood, string>;

/** 펫 이름 */
export const PET_NAME: Record<PetKey, string> = {"bunny":"토끼","cat":"고양이","hamster":"햄스터"} as Record<PetKey, string>;

/** 퀴즈 주제 */
export const TOPICS: Topic[] = [{"k":"web","n":"웹 기초","ico":""},{"k":"js","n":"자바스크립트","ico":""},{"k":"cs","n":"컴퓨터 상식","ico":""},{"k":"english","n":"영어 단어","ico":""}];

/** 문제 (가데이터) */
export const QUESTIONS: Question[] = [{"q":"다음 중 HTML의 의미로 가장 알맞은 것은?","o":["Hyper Text Markup Language","High Tech Modern Language","Home Tool Markup Language","Hyperlink Text Makeup"],"a":0,"e":"HTML은 Hyper Text Markup Language의 약자로, 웹페이지의 구조(뼈대)를 만드는 마크업 언어예요."},{"q":"웹페이지의 색상과 배치 등 스타일을 담당하는 언어는?","o":["HTML","CSS","SQL","JSON"],"a":1,"e":"CSS(Cascading Style Sheets)는 색상·글꼴·배치 등 웹페이지의 '꾸미기'를 담당해요."},{"q":"자바스크립트에서 변수를 선언하는 키워드가 아닌 것은?","o":["let","const","var","int"],"a":3,"e":"let, const, var는 변수 선언 키워드예요. int는 자바스크립트에 없는 키워드랍니다."},{"q":"HTML에서 가장 큰 제목을 나타내는 태그는?","o":["<h1>","<p>","<title>","<big>"],"a":0,"e":"<h1>이 가장 큰 제목이고, 숫자가 커질수록(h2~h6) 제목 글씨가 작아져요."},{"q":"다른 페이지로 이동하는 링크를 만들 때 쓰는 태그는?","o":["<img>","<a>","<div>","<link>"],"a":1,"e":"<a> 태그는 href 속성을 이용해 다른 페이지나 사이트로 이동하는 링크를 만들어요."}];

/** 선택 가능한 펫 (부화 시 랜덤 배정) */
export const PETS: PetKey[] = ["bunny", "cat", "hamster"];

/** 레벨업에 필요한 EXP (Lv1→2 = 50, 정답 5개 = 한 세션) */
export const expForLevel = (level: number): number => 20 + level * 30;

/** 정답/오답 보상 */
export const EXP_CORRECT = 10;
export const EXP_WRONG = -5;
export const COIN_CORRECT = 20;
export const LEVELUP_COIN = 100;
export const START_COINS = 300;
export const START_STREAK = 5;
export const MAX_HEARTS = 3;
