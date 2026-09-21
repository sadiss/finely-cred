/** Re-export Marketing HQ model for admin OS modules (desks live inside departments). */
export {
  MARKETING_DEPARTMENTS,
  marketingDepartments,
  getDepartment,
  getRoomSnapshot,
  START_RESTORE_CAMPAIGN,
  type MarketingDepartment,
  type MarketingDepartmentId,
  type MarketingChannelDesk,
  type MarketingDesk,
  type MarketingDepartmentFloor,
  type MarketingChannelId,
  type DeskRole,
  type SendStatus,
} from '../features/marketingHq/marketingHqModel';
