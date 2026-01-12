#在下方记录关于上下限时间留痕功能方案规划
##需求1:要求用户尽量无感,只关注到操作kos上线下线就行
##需求2:有入口可以查看到kos的上下限操作时间轨迹并且可以调整

##执行1:在 KOS 列表管理中列表中添加 上/下限 快捷按钮,方便用户对kos进行快速的上/下限 
##执行2:在 KOS 进行上/下限操作时,记录上下限时间
##执行3:在 KOS 列表管理列表中添加 统计时间 按钮,点击会出现弹窗，弹窗中显示了操作的上/下限时间,并切时间可修改/删除



SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for kos_on_off_record
-- ----------------------------
DROP TABLE IF EXISTS `kos_on_off_record`;
CREATE TABLE `kos_on_off_record` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `用户ID` varchar(32) COLLATE utf8mb4_general_ci NOT NULL,
  `起始时间` varchar(32) COLLATE utf8mb4_general_ci NOT NULL,
  `结束时间` varchar(32) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SET FOREIGN_KEY_CHECKS = 1;