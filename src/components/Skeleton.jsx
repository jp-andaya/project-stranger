import styles from './Skeleton.module.css';

const Skeleton = ({ width = '100%', height = '16px', radius = 4, style = {} }) => (
  <div
    className={styles.skeleton}
    style={{ width, height, borderRadius: radius, ...style }}
  />
);

export default Skeleton;
