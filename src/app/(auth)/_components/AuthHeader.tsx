import EggSprite from "@/components/pixel/EggSprite";
import styles from "./AuthHeader.module.scss";

/** 로그인·회원가입 상단 헤더 (타이틀 + 물음표 알) */
export default function AuthHeader({ sub }: { sub: string }) {
  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>퀴즈펫</h1>
        <p className={styles.tagline}>매일 퀴즈로 키우는 나의 펫</p>
        <p className={styles.sub}>{sub}</p>
      </div>
      <div className={styles.egg}>
        <EggSprite size={38} withQuestion />
      </div>
      <p className={styles.hint}>문제를 풀고 알을 깨보자!</p>
    </>
  );
}
