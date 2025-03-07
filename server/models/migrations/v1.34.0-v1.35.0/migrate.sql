-- migration from v1.34.0 to v1.35.0

-- @jniles: modify the email fields to standarize the field length
ALTER TABLE `patient` MODIFY `email` VARCHAR(150) DEFAULT NULL;
ALTER TABLE `debtor_group` MODIFY `email` VARCHAR(150) DEFAULT '';
ALTER TABLE `enterprise` MODIFY `email` VARCHAR(150) DEFAULT NULL;
ALTER TABLE `supplier` MODIFY `email` VARCHAR(150) DEFAULT NULL;
ALTER TABLE `user` MODIFY `email` VARCHAR(150) DEFAULT NULL;

/*
 * @author: lomamech
 * @date: 2024-11-27
 * @description: Fix and Update Cashflow Report and Budget Report #7897
 */

INSERT INTO `account_reference_type` (`id`, `label`, `fixed`) VALUES (8, 'FORM.LABELS.BUDGET_ANALYSIS', 1);
