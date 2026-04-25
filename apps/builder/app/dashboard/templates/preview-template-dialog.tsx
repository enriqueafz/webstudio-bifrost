import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  DialogClose,
  Flex,
  Button,
  theme,
} from "@webstudio-is/design-system";
import type { DashboardProject } from "@webstudio-is/dashboard";
import { builderUrl } from "~/shared/router-utils";

type PreviewTemplateDialogProps = {
  project: DashboardProject;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSelect: () => void;
};

export const PreviewTemplateDialog = ({
  project,
  isOpen,
  onOpenChange,
  onSelect,
}: PreviewTemplateDialogProps) => {
  const url = builderUrl({
    origin: window.origin,
    projectId: project.id,
    mode: "preview",
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        css={{
          maxWidth: "95vw",
          maxHeight: "95vh",
          width: "1200px",
          height: "800px",
          padding: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Flex
          direction="row"
          justify="between"
          align="center"
          css={{
            padding: theme.spacing[4],
            borderBottom: `1px solid ${theme.colors.borderMain}`,
          }}
        >
          <DialogTitle css={{ margin: 0 }}>
            Preview: {project.title}
          </DialogTitle>
          <Flex gap="2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button variant="info" onClick={onSelect}>
              Use this Template
            </Button>
          </Flex>
        </Flex>

        <Flex
          grow
          css={{
            background: theme.colors.backgroundMain,
            position: "relative",
          }}
        >
          <iframe
            src={url}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              background: "white",
            }}
            title={`Preview of ${project.title}`}
          />
        </Flex>
      </DialogContent>
    </Dialog>
  );
};
